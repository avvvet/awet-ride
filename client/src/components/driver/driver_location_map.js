import React, { Component } from 'react';
import { render } from 'react-dom';
import  {Route, Redirect, BrowserRouter, NavLink } from 'react-router-dom';
import {Grid, Row, Col, Alert, Image, Button, Badge, FormControl, FormGroup, ControlLabel} from 'react-bootstrap';
import L from 'leaflet';
import $ from 'jquery';
import _ from 'lodash';
//import socketClient from 'socket.io-client';

import DriverMenu from './driver_menu';
import VerificationRply from '../verfication_rply';
import DriverRideCancel from './driver_ride_cancel';
import DriverDashBoard from './driver_dashboard'
import { resolve } from 'path';

var validator = require('validator');

//const socket = socketClient('http://localhost:7000');
const env = require('../../env')
const {Howl, Howler} = require('howler');
const sound = new Howl({
    src: ["/assets/sounds/awet-ride.mp3","/assets/sounds/awet-ride.ogg","/assets/sounds/awet-ride.m4r"],
    autoplay: true,
    loop: true,
    volume: 0.0
});
var pickUpIcon = L.icon({
    iconUrl: '/assets/awet-rider-m.png',
    shadowUrl: '',

    iconSize:     [50, 50], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [12, 50], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-1, -45] // point from which the popup should open relative to the iconAnchor
});
var dropOffIcon = L.icon({
    iconUrl: '/assets/awet-ride-dropoff-marker.png',
    shadowUrl: '',
    iconSize:     [80, 80], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [0, 75], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -75] // point from which the popup should open relative to the iconAnchor
});
var currentLocationIcon = L.icon({
    iconUrl: '/assets/awet-ride-marker-1.png',
    shadowUrl: '',
    iconSize:     [80, 49], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [20, 20], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [20, -5] // point from which the popup should open relative to the iconAnchor
});
 
class DriverLocation extends Component {
   constructor() {
       super();
       this.state = {
           current_latlng: {
               lat: 0,
               lng: 0
           },
           last_current_latlng : {
               lat: 0,
               lng: 0
           },
           isLogedIn : false,
           pickup_latlng: '',
           dropoff_latlng: '',
           driver_id: '',
           markerGroup: '',
           locationGroup: '',
           map : '',
           auth: false,
           soundFlag : false,
           driver: {
               firstName: '',
               middleName: '',
               email: '',
               mobile: '',
               gender:'',
               profile: '',
               hasProfile: '',
               verified: '',
               isCarRegistered: '',
               status: ''
           },
           profile_pic : '',
           imagePreviewUrl : '/assets/awet-rider-m.png',
           file : '',
           varificationCode: '',
           ride_id : '',
           ridePrice: '',
           rideDistance: '',
           rideTime: '',
           rideUser: '',
           userMobile: '',
           userPic: '',
           driverName : '',
           driverMobile : '',
           amount: '',
           charge: '',
           total_rides: '',
           pickupRoutFlag : false,
           locationFoundFlag : false,
           stopMapViewFlag : false,
           model : '',
           model_year : '',
           code: '',
           plate_no : ''
       }

    this.checkForRide = this.checkForRide.bind(this);
    this.getDriver = this.getDriver.bind(this);
    this.driverCurrentLocation = this.driverCurrentLocation.bind(this);
    this.acceptRide = this.acceptRide.bind(this);
    this.rideCompleted = this.rideCompleted.bind(this);
    this.showPickUpLocation = this.showPickUpLocation.bind(this);
    this.showPickUpRoute = this.showPickUpRoute.bind(this);
    this.showDropOffLocation = this.showDropOffLocation.bind(this);
    this.showDropOffRoute = this.showDropOffRoute.bind(this);
    this.timeConvert = this.timeConvert.bind(this);
    this.driverRidesInfo = this.driverRidesInfo.bind(this);
   }
   

   getDriver = (token) => {
    $.ajax({ 
        type:"GET",
        url:"/driver/get",
        headers: { 'x-auth': token },
        contentType: "application/json",
        success: function(driver, textStatus, jqXHR) {
            console.log('driver data is ', driver)
          this.setState({
              driver: driver,
              isLogedIn : true,
          });   
        }.bind(this),
        error: function(xhr, status, err) {
            console.log('getdriver', err.toString());
            console.error(xhr, status, err.toString());
        }.bind(this)
    });  
   }

//    socketConnect = (_obj) => {
//     socket.on('connect', function(){
//         console.log('client connected');

//         socket.emit('join', _obj, function(err) {
//             if(err) {
//                alert(err);
//             }
//         });
//     });
    
//     socket.on('driveRequest' , function(msg) {
//         console.log('drive request' , msg);
//     })
    
//     socket.on('disconnect', function(){
//         console.log('client disconnected');
//     });
//    }
   
//    socketJoin = (_obj) => {
    
//    }

   componentDidMount(){
    this.getDriver(sessionStorage.getItem("_auth_driver"));   
    this.setState({
        auth: sessionStorage.getItem("_auth_driver")
    });

    this.driverRidesInfo();
    
    //this.socketConnect(data);

    var map = L.map('mapid').setView([9.0092, 38.7645], 17);
    map.locate({setView: true, maxZoom: 17});
    
    this.setState({map : map});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    this.setState({
        markerGroup : new L.LayerGroup().addTo(map),
        locationGroup : new L.LayerGroup().addTo(map)
    });
   
    this.timerCheckForRide = setInterval(this.checkForRide, 5000);
    this.timerDriverLocation = setInterval(this.driverCurrentLocation, 10000);

    map.on('locationfound', (e) => {
        var locationGroup = this.state.locationGroup;
        locationGroup.clearLayers();
        
        this.setState({current_latlng : e.latlng});
        var radius = e.accuracy / 1024;
        radius = radius.toFixed(2);
        L.marker(e.latlng, {icon: currentLocationIcon}).addTo(locationGroup)
        .bindPopup("You are " + radius + " meters from this point").openPopup();
        
        L.circle(e.latlng, radius).addTo(locationGroup);
        map.setView(e.latlng,17);
         
    });
    
    function onLocationError(e) {
        console.log("location error", e.message);
    }

    map.on('locationerror', onLocationError);

   }

   componentDidUpdate() {
     
   }

   driverCurrentLocation = () => {
    let PromiseLocateDriver = new Promise((resolve, reject)=>{
            var map = this.state.map;
            map.locate();
            resolve(true); 
    });

    PromiseLocateDriver.then((r)=>{
        if(!_.isEqual(this.state.current_latlng,this.state.last_current_latlng)){
            console.log('current latlng', this.state.current_latlng, this.state.last_current_latlng);
            var token = sessionStorage.getItem("_auth_driver");
            var current_latlng = {
                _latlng : `POINT(${this.state.current_latlng.lat} ${this.state.current_latlng.lng})`, 
            }; 
            $.ajax({ 
                type:"POST",
                url:"/driver/updateLocation",
                headers: { 'x-auth': token },
                data: JSON.stringify(current_latlng), 
                contentType: "application/json",
                success: function(data, textStatus, jqXHR) {
                  console.log('drive location update', data);
                }.bind(this),
                error: function(xhr, status, err) {
                    console.error(xhr, status, err.toString());
                }.bind(this)
            });
            this.setState({last_current_latlng : this.state.current_latlng})
        } 
    }); 
   }

   driverRidesInfo = () => {
    var driver = {
        status : 777
    };
    $.ajax({ 
        type:"POST",
        url:"/driver/getRidesInfo",
        headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
        data: JSON.stringify(driver), 
        contentType: "application/json",
        success: (driver) => {
            if(driver.length > 0){
                console.log('driver info', driver);
                this.setState({
                    driverName : driver[0].driver.firstName,
                    driverMobile : driver[0].driver.mobile,
                    amount : driver[0].amount,
                    charge : driver[0].charge,
                    total_rides: driver[0].total_rides
                });
            } else {
                console.log('driver has no payment', this.state.driver);
                this.setState({
                    driverName : this.state.driver.firstName,
                    driverMobile : this.state.driver.mobile,
                    amount : 0.00,
                    charge : 0.00,
                    total_rides: 0
                });
            }  
        },
        error: function(xhr, status, err) {
            console.error('ride completed error', err.toString());
        }.bind(this)
    });  
   }

   checkForRide = () => {
        var driver = {
            status : 1
        };

        $.ajax({
            type:"POST",
            url:"/ride/check_ride_driver",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(driver), 
            contentType: "application/json"
         })
         .done( (ride) => {
            console.log('done done', ride);
         })
         .fail(function (errorHandler, soapResponse, errorMsg) {
             console.log('Error', errorMsg);
         })
         .always((ride) => {
             console.log('always ', ride);
             if(!_.isNull(ride)) {
                if(ride.status === 1) {
                    sound.volume(0.7, this.soundAccept);        
                    this.setState({
                        ridePrice: ride.route_price,
                        rideDistance: ride.route_distance,
                        rideTime: ride.route_time,
                        rideUser: ride.user.firstName + ' ' + ride.user.middleName,
                        userMobile: ride.user.mobile,
                        userPic: "/assets/profile/user/" + ride.user.profile,
                    });
                    document.getElementById('check-ride-dashboard').style.visibility="visible";
                    this.showPickUpLocation(ride.pickup_latlng.coordinates, this.state.current_latlng); 
                    clearInterval(this.timerCheckForRide);
                    clearInterval(this.timerUserLocation);  //stop locating while accepting the request
                } else if (ride.status === 7) {
                    this.acceptRideAction(ride);
                    clearInterval(this.timerCheckForRide);
                } else if (ride.status === 77) {
                    this.setState({
                        ridePrice: ride.route_price,
                        rideDistance: ride.route_distance,
                        rideTime: ride.route_time,
                        rideUser: ride.user.firstName + ' ' + ride.user.middleName,
                        userMobile: ride.user.mobile,
                        userPic: "/assets/profile/user/" + ride.user.profile,
                    });
                    this.showDropOffLocation(this.state.pickup_latlng, this.state.dropoff_latlng);
                    clearInterval(this.timerCheckForRide);
                }        
             }
             
         }); 
    }

    acceptRide = () => {
        console.log('accept called');
        var driver = {
            status : 7
        };
        $.ajax({ 
            type:"POST",
            url:"/ride/accepted",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(driver), 
            contentType: "application/json",
            success: function(ride, textStatus, jqXHR) {
                if(ride){
                   this.acceptRideAction(ride);
                }  
            }.bind(this),
            error: function(xhr, status, err) {
                console.error('accept test case error', err.toString());
            }.bind(this)
        });  
    }

    acceptRideAction = (ride) => {
        this.setState({
            ridePrice: ride.route_price,
            rideDistance: ride.route_distance,
            rideTime: ride.route_time,
            rideUser: ride.user.firstName + ' ' + ride.user.middleName,
            userMobile: ride.user.mobile,
            userPic: "/assets/profile/user/" + ride.user.profile,
            ride_id : ride.id
        });
        sound.volume(0,this.soundAccept); 
        let PromiseSlientAlert = new Promise((resolve, rejects) => {
         document.getElementById('check-ride-dashboard').style.visibility="hidden"; 
         document.getElementById("driver-dashboard").style.visibility = "hidden";
         document.getElementById("driver-pax-action").style.visibility = "visible";
         sound.volume(0,this.soundAccept); 
         this.setState({
             pickup_latlng : ride.pickup_latlng.coordinates,
             dropoff_latlng: ride.dropoff_latlng.coordinates,
             stopMapViewFlag : true
         })
         resolve();
        });
         
        PromiseSlientAlert.then(()=>{
           //show the driver the pickup location 
           this.showPickUpLocation(ride.pickup_latlng.coordinates);
           this.timerDriverLocation = setInterval(this.driverCurrentLocation, 10000);  //start showing curreent location 
        });
    }

    rideCompleted = () => {
        var driver = {
            status : 777
        };
        $.ajax({ 
            type:"POST",
            url:"/ride/completed",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(driver), 
            contentType: "application/json",
            success: (_ride) => {
                console.log('payment returned', _ride);
                if(_ride){
                    this.rideCompletedAction(_ride);
                }  
            },
            error: function(xhr, status, err) {
                console.error('ride completed error', err.toString());
            }.bind(this)
        });  
    }

    rideCompletedAction = (ride) => {
        let PromiseRemoveAll = new Promise((resolve, rejects) => {
            document.getElementById("driver-pax-action").style.visibility = "hidden";
            document.getElementById("driver-pax-end-action").style.visibility = "hidden";
            document.getElementById("check-ride-dashboard").style.visibility = "hidden";
            
            var map = this.state.map;
            var markerGroup = this.state.markerGroup;
            markerGroup.clearLayers();
            //map.removeControl(this.routeControl);
            //map.locate({setView: true, maxZoom: 17});
           
            this.setState({
                pickupRoutFlag : false,
                stopMapViewFlag : false
             });

            resolve(true);
        });

        PromiseRemoveAll.then(()=>{
            this.driverRidesInfo();
            this.timerCheckForRide = setInterval(this.checkForRide, 5000); //lets wait for ride again
            document.getElementById("driver-dashboard").style.visibility = "visible"; 
        });
    }

    paxFound = () => {
        var driver = {
            status : 77
        };
        $.ajax({ 
            type:"POST",
            url:"/ride/paxFound",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(driver), 
            contentType: "application/json",
            success: (_ride) => {
                if(_ride){
                    this.showDropOffLocation(this.state.pickup_latlng, this.state.dropoff_latlng);
                }  
            },
            error: function(xhr, status, err) {
                console.error('ride completed error', err.toString());
            }.bind(this)
        });  
    }

    
    showPickUpLocation = (_pickup_latlng, _driver_latlang) => {
        var map = this.state.map;
        var markerGroup = this.state.markerGroup;
        L.marker(_pickup_latlng, {icon: pickUpIcon}).addTo(markerGroup)
        .bindPopup("Pick passenger here.").openPopup();
        map.setView(_pickup_latlng,15);
        this.showPickUpRoute(_driver_latlang, _pickup_latlng);
    }

    showPickUpRoute = (latlng1, latlng2) => {
      if(!this.state.pickupRoutFlag){
       var map = this.state.map;
       if(this.routeControl){
           map.removeControl(this.routeControl);
           this.routeControl = null;
       }
       console.log('show pickup route', latlng1)
       this.routeControl = L.Routing.control({
            waypoints: [
             L.latLng(latlng1),
             L.latLng(latlng2)
            ],
            routeWhileDragging: false,
            addWaypoints : false, //disable adding new waypoints to the existing path
            show: false,
            createMarker: function (){
                return null;
            },
            router: L.Routing.osrmv1({
                serviceUrl: env.ROUTING_SERVICE
            })
        })
        .on('routesfound', this.routeFound)
        .addTo(map); 
      }
    }

    routeFound = () => {
        this.setState({
            pickupRoutFlag : true
         });
    }

    showDropOffLocation = (latlng1,latlng2) => {
         let PromiseRemoveShowDropoff = new Promise((resolve, rejects) => {
            document.getElementById("driver-pax-action").style.visibility = "hidden";
            document.getElementById("driver-pax-end-action").style.visibility = "visible";
            resolve(true);
        });

        PromiseRemoveShowDropoff.then(()=>{
            var map = this.state.map;
            var markerGroup = this.state.markerGroup;
            L.marker(latlng1, {icon: pickUpIcon}).addTo(markerGroup)
            .bindPopup("Pickup location.").openPopup();
            L.marker(latlng2, {icon: dropOffIcon}).addTo(markerGroup)
            .bindPopup("Final dropoff location.").openPopup();
            map.setView(latlng2,15);
            
            this.showDropOffRoute(latlng1,latlng2);
        });
    }

    showDropOffRoute = (latlng1, latlng2) => {
        var map = this.state.map;
        map.removeControl(this.routeControl);
        this.routeControl = L.Routing.control({
            waypoints: [
             L.latLng(latlng1),
             L.latLng(latlng2)
            ],
            routeWhileDragging: false,
            addWaypoints : false, //disable adding new waypoints to the existing path
            show: false,
            createMarker: function (){
                return null;
            },
            router: L.Routing.osrmv1({
                serviceUrl: env.ROUTING_SERVICE
            })
        })
        .on('routesfound', this.routeFound)
        .addTo(map);  
    }

    timeConvert = (n) => {
        var num = n;
        var hours = (num / 3600);
        var rhours = Math.floor(hours);
        var minutes = (hours - rhours) * 60;
        var rminutes = Math.round(minutes);
        
        var hDisplay = rhours > 0 ? rhours + " hr" : "";
        var mDisplay = rminutes > 0 ? rminutes + " min" : "";
        return hDisplay + mDisplay; 
    }

    validateVarification = () => {
        let errors = [];
        
        if(this.state.varificationCode.length === 0) {
            errors.push("Varification field is empty.");
        } else if (validator.isLength(this.state.varificationCode, {min: 5}) === false){
            errors.push("Code must not be less than 5 characters");
        }else if(validator.isLength(this.state.varificationCode, {max: 5}) === false){
            errors.push("Code is greater than 5 characters");
        } else if (validator.isNumeric(this.state.varificationCode, {no_symbols: true} ) === false) {
            errors.push("Varification number is not valid");
        }
    
        return errors;
    }

    validateCarRegistration = () => {
        let errors = [];
        
        if(this.state.model.length === 0) {
            errors.push("Select model.");
        } else if (this.state.model_year.length === 0){
            errors.push("Select year");
        }

        if(this.state.code.length === 0){
            errors.push("Select plate code");
        } 

        if(this.state.plate_no.length === 0 ) {
            errors.push("Plate Number is empty.");
        } else if(validator.isAlphanumeric(this.state.plate_no) === false) {
            errors.push("Plate Number is not valid.");
        } else if(validator.isLength(this.state.plate_no, {min: 5, max: 6}) === false){
            errors.push("Plate Number is not correct");
        }
    
        return errors;
    }    

    getErrorList(errors){
        var i = 0;
        let error_list = errors.map(error => {
            return <li key={i++}>{error}</li>
        });
        return error_list;
    }

    change = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    onVarify = (e) => {
        e.preventDefault();
        const err = this.validateVarification();
        if(err.length > 0){
            let error_list = this.getErrorList(err);
            render(<Alert bsStyle="danger" >{error_list}</Alert>,document.getElementById('FormError'));
        } else {
            var data = {
                varification_code : this.state.varificationCode
            }
            this.varify(data)
            this.setState({
                varificationCode : '',
                errors: []
            });
        }
    }

    varify = (data) => {
        $.ajax({ 
            type:"POST",
            url:"/driver/mobile_verification",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(data), 
            contentType: "application/json",
            success: function(data, textStatus, jqXHR) {
               if(data){
                render(<VerificationRply></VerificationRply>,document.getElementById('account-verfiy'));
                //document.getElementById('account-verfiy').style.visibility = 'hidden';
                this.getDriver(sessionStorage.getItem("_auth_driver")); //reload user after varification
               } 
            }.bind(this),
            error: function(xhr, status, err) {
                render(<Alert bsStyle="danger" >Verification faild !</Alert>,document.getElementById('FormError'));
                console.error(xhr, status, err.toString());
            }.bind(this)
        });  
    }

    onValidateCarRegister = (e) => {
        e.preventDefault();
        const err = this.validateCarRegistration();
        if(err.length > 0){
            let error_list = this.getErrorList(err);
            render(<Alert bsStyle="danger" >{error_list}</Alert>,document.getElementById('err_car_register'));
        } else {
            var data = {
                model : this.state.model,
                model_year : this.state.model_year,
                code : this.state.code,
                plate_no : this.state.plate_no
            }

            this.validateCarRegister(data);
            this.setState({
                model : '',
                model_year : '',
                code : '',
                plate_no : '',
                errors: []
            });
        }
    }

    validateCarRegister = (data) => {
        $.ajax({ 
            type:"POST",
            url:"/car/register",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(data), 
            contentType: "application/json",
            success: function(data, textStatus, jqXHR) {
               if(data){
                render(<VerificationRply></VerificationRply>,document.getElementById('register-car'));
                //document.getElementById('account-verfiy').style.visibility = 'hidden';
                this.getDriver(sessionStorage.getItem("_auth_driver")); //reload user after varification
               } 
            }.bind(this),
            error: function(xhr, status, err) {
                render(<Alert bsStyle="danger" >Car registration faild !</Alert>,document.getElementById('err_car_register'));
                console.error(xhr, status, err.toString());
            }.bind(this)
        });  
    }

    _onChange_profile = (e) => {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];
    
        reader.onloadend = () => {
          this.setState({
            file: file,
            imagePreviewUrl: reader.result
          });
        }
    
        reader.readAsDataURL(file)
    }

    validateProfile = () => {
        console.log('file', this.state.file);
        let errors = [];
        
        if(this.state.file.length === 0) {
            errors.push("Picture is empty. Browse first.");
        } 

        if(this.state.file.size > 1024000) {
            errors.push("Selected Picture is very large");
        }
       
        if(this.state.file.size > 0) {
            
            var t = this.state.file.type.split('/').pop().toLowerCase();
            console.log('ttt', t);
            if (t != "jpeg" && t != "jpg" && t != "png" && t != "bmp" && t != "gif") {
                errors.push('Please select a valid image file');
            }
        }
        
        return errors;
    }

    onProfileUpload = (e) => {
        e.target.disabled = true;
        e.preventDefault();
        const err = this.validateProfile();
        if(err.length > 0){
            e.target.disabled = false;
            let error_list = this.getErrorList(err);
            render(<Alert bsStyle="danger" >{error_list}</Alert>,document.getElementById('ProfileError'));
        } else {
            this.uploadProfile(e);
            this.setState({
                file : '',
                imagePreviewUrl : '',
                errors: []
            });
        }
    }

    uploadProfile = (e) => {
        const formData = new FormData();
        formData.append('myImage',this.state.file);
        console.log('dataaa', formData, this.state.file);
        $.ajax({ 
            type:"POST",
            url:"/driver/profile",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: formData, 
            cache: false,
            contentType: false,
            processData: false,
            success: function(data, textStatus, jqXHR) {
              if(data.length > 0) {
                if(data[0] === 1) {
                   document.getElementById('div-profile').style.visibility = 'hidden';
                   this.getDriver(sessionStorage.getItem("_auth_driver"));
                } else {
                    e.target.disabled = false;
                    render(<Alert bsStyle="danger" >Not updated. Try again !</Alert>,document.getElementById('ProfileError'));
                }
              }
            }.bind(this),
            error: function(xhr, status, err) {
                e.target.disabled = false;
                render(<Alert bsStyle="danger" >Connection error, try again !</Alert>,document.getElementById('ProfileError'));
            }.bind(this)
        });  
    }

    cancelRide = (e) => {
        render(<DriverRideCancel ride_id={this.state.ride_id} rideCompletedAction={this.rideCompletedAction}></DriverRideCancel>,document.getElementById('driver-ride-cancel'));
    }

    render(){
        return(
            <div>
                <div className="driver-dashboard" id="driver-dashboard">
                <Grid fluid>
                    <Row className="text-center">
                      {this.state.driver.hasProfile === true ?  
                      <Col xs={4} sm={4} md={4}><Image src={'/assets/profile/driver/' + this.state.driver.profile} height={35} circle></Image></Col>
                      : 
                      <Col xs={4} sm={4} md={4}><Image src={'/assets/awet-rider-m.png'} height={35} circle></Image></Col>
                      }
                      <Col xs={4} sm={4} md={4} className="colPadding">{this.state.isLogedIn === true ? 'hi ' + this.state.driver.firstName : 'hi there!'}</Col>
                      <Col xs={4} sm={4} md={4} className="colPadding">{this.state.isLogedIn === true ? <NavLink to="/driver/login">Logout</NavLink> : <NavLink to="/driver/login">Login</NavLink>}</Col>   
                    </Row>
                    <Row>
                        <Col xs={6} sm={6} md={6}>earning</Col>
                        <Col xs={6} sm={6} md={6}>ride </Col>
                    </Row>
                    <Row>
                        <Col xs={6} sm={6} md={6}><Badge>{this.state.amount + ' br'}</Badge></Col>
                        <Col xs={6} sm={6} md={6}><Badge>{this.state.total_rides}</Badge></Col>
                    </Row>
                    <Row>
                        <Col xs={6} sm={6} md={6}>charge </Col>
                        <Col xs={6} sm={6} md={6}>account</Col>
                    </Row>
                    <Row>
                        <Col xs={6} sm={6} md={6}><Badge className="charge">{this.state.charge}</Badge></Col>
                        <Col xs={6} sm={6} md={6}><Badge className="account">active</Badge></Col>
                    </Row>
                </Grid>
                </div>
                
                {this.state.driver.isCarRegistered === false ? 
                <div className="register-car" id="register-car">
                        <form>
                        <Alert bsStyle="warning" onDismiss={this.handleDismiss}>
                            <h4>Register your car !</h4>
                            <p>
                                Enter correct information about your car. 
                                Incorrect or false information will lead to
                                block your account.
                            </p>
                            <p>
                               <Grid fluid>
                                   <Row>
                                   <Col xs={6} sm={6} md={6}>
                                   <FormGroup>
                                        <ControlLabel>Model</ControlLabel>
                                        <FormControl name="model" componentClass="select" placeholder="select" onChange={e => this.change(e)}>
                                            <option value="">select</option>
                                            <option value="corolla">COROLLA</option>
                                            <option value="vitiz">VITIZ</option>
                                            <option value="vitiz">LIFAN</option>
                                        </FormControl>
                                    </FormGroup>
                                   </Col>
                                   <Col xs={6} sm={6} md={6}> 
                                   <FormGroup>
                                        <ControlLabel>Year</ControlLabel>
                                        <FormControl name="model_year" componentClass="select" placeholder="select" onChange={e => this.change(e)}>
                                            <option value="">select</option>
                                            <option value="2019">2019</option>
                                            <option value="2018">2018</option>
                                            <option value="2017">2017</option>
                                            <option value="2016">2016</option>
                                            <option value="2015">2015</option>
                                            <option value="2014">2014</option>
                                            <option value="2013">2013</option>
                                        </FormControl>
                                    </FormGroup>
                                   </Col>
                                   </Row>

                                   <Row>
                                   <Col xs={6} sm={6} md={6}>
                                   <FormGroup>
                                        <ControlLabel>Code</ControlLabel>
                                        <FormControl name="code" componentClass="select" placeholder="select" onChange={e => this.change(e)}>
                                            <option value="">select</option>
                                            <option value="01">01</option>
                                            <option value="02">02</option>
                                            <option value="03">03</option>
                                        </FormControl>
                                    </FormGroup>
                                   </Col>
                                   <Col xs={6} sm={6} md={6}> 
                                   <FormGroup>
                                        <ControlLabel>Plate #</ControlLabel>
                                        <FormControl
                                        name="plate_no"
                                        type="text"
                                        value={this.state.plate_no}
                                        placeholder="Plate No."
                                        onChange={e => this.change(e)}
                                        >
                                        </FormControl>
                                    </FormGroup>
                                   </Col>
                                   </Row>

                                   <Row>
                                    <Col xs={12} sm={12} md={12}>
                                    <Button bsStyle="warning" onClick={(e) => this.onValidateCarRegister(e)} block>REGISTER</Button>
                                    </Col>
                                   </Row>

                                   <Row className="rowPadding">
                                    <Col xs={12} sm={12} md={12}>
                                      <div className="err_car_register" id="err_car_register"></div>
                                    </Col>
                                   </Row>
                               </Grid>
                            </p>
                        </Alert>
                        </form>
                </div>
                : ''}

                {this.state.driver.verified === false ?  
                <div className="account-verify" id="account-verfiy">
                        <form>
                        <Alert bsStyle="success" onDismiss={this.handleDismiss}>
                            <h4>Final step! Varify your mobile!</h4>
                            <p>
                                If the mobile number {this.state.driverMobile} is yours. 
                                Enter the text message sent to your mobile
                                and click varify.
                            </p>
                            <p>
                               <Grid fluid>
                                   <Row>
                                   <Col xs={6} sm={6} md={6}>
                                        <FormGroup>
                                        <FormControl
                                        name="varificationCode"
                                        type="text"
                                        value={this.state.varificationCode}
                                        placeholder="XXXXX"
                                        onChange={e => this.change(e)}
                                        >
                                        </FormControl>
                                        </FormGroup>
                                   </Col>
                                   <Col xs={6} sm={6} md={6}> 
                                     <Button bsStyle="primary" onClick={(e) => this.onVarify(e)} block>VARIFY</Button>
                                   </Col>
                                   </Row>
                                   <Row>
                                    <Col xs={12} sm={12} md={12}>
                                      <div className="FormError" id="FormError"></div>
                                    </Col>
                                   </Row>
                               </Grid>
                            </p>
                        </Alert>
                        </form>
                </div>
                : ''}

                {this.state.driver.verified === true && this.state.driver.isCarRegistered === true && this.state.driver.hasProfile === false ? 
                <div className="div-profile" id="div-profile">
                <Grid fluid>
                <Alert bsStyle="success" onDismiss={this.handleDismiss}>
                                <h4>Finaly ! Profile picture.</h4>
                                <p>
                                    Helps to identify who you are.
                                </p>
                                <p>
                                    <form>
                                        <Row className="text-center"> 
                                            <Col xs={6} sm={6} sm={6}>
                                            <FormGroup>
                                            <FormControl
                                                title=" "
                                                className="file1"
                                                name="profile_pic"
                                                type="file"
                                                onChange={e => this._onChange_profile(e)}
                                            >
                                            </FormControl> 
                                            </FormGroup>
                                            </Col>

                                            <Col xs={6} sm={6} sm={6}>
                                            <Image src = {this.state.imagePreviewUrl} height={35} circle></Image>
                                        </Col>
                                        </Row>

                                        <Row className="rowPaddingSm text-center">
                                            <Col xs={12} sm={12} md={12}>
                                            <Button  onClick={(e) => this.onProfileUpload(e)} bsStyle="info" bsSize="small" disabled={false}>Upload Image</Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                        <Col xs={12} sm={12} md={12}>
                                        <div className="ProfileError" id="ProfileError"></div>
                                        </Col>
                                    </Row>
                                    </form>
                                </p>
                            </Alert>
                </Grid>
                </div>
                : '' }

                <div id="driver-ride-cancel" className="driver-ride-cancel"></div>

                <div className="check-ride-dashboard shake-ride-request" id="check-ride-dashboard"> 
                <Grid fluid>
                    <Row>
                        <Col xs={3} sm={3} md={3}><Image src={this.state.userPic} height={35} circle></Image></Col>
                        <Col xs={3} sm={3} md={3}>{this.state.ridePrice + ' br'}</Col>
                        <Col xs={3} sm={3} md={3}>{this.state.rideDistance + ' km'}</Col>
                        <Col xs={3} sm={3} md={3}>{this.timeConvert(Number.parseInt(this.state.rideTime))}</Col>
                    </Row>
                    
                    <Row>
                      <Col xs={12} sm={12} md={12}>
                       <Button  onClick={(e) => this.acceptRide()} bsStyle="success" bsSize="large" block>ACCEPT RIDE</Button>
                      </Col>
                    </Row>
                </Grid>
                </div>

                <div id="driver-pax-action"  className="driver-pax-action shake-ride-to-pickup">
                  <Grid fluid>
                    <Row>
                        <Col xs={3} sm={3} md={3}><Image src={this.state.userPic} height={35} circle></Image></Col>
                        <Col xs={3} sm={3} md={3}>{this.state.ridePrice + ' br'}</Col>
                        <Col xs={3} sm={3} md={3}>{this.state.rideDistance + ' km'}</Col>
                        <Col xs={3} sm={3} md={3}>{this.timeConvert(Number.parseInt(this.state.rideTime))}</Col>
                    </Row>
                    <Row>
                      <Col xs={6} sm={6} md={6}>
                       {this.state.rideUser}
                      </Col>
                      <Col xs={6} sm={6} md={6}>
                       {this.state.userMobile}
                      </Col>
                    </Row>
                    
                    <Row>
                        <Col xs={12} sm={12} md={12}>
                          <Button  onClick={(e) => this.paxFound()} bsStyle="success" bsSize="small" block>I FOUND THE PASSENGER</Button>
                        </Col>
                    </Row>
                    <Row className="rowPadding">
                        <Col xs={12} sm={12} md={12}>
                          <Button  onClick={(e) => this.cancelRide()}  bsSize="small" block>CANCEL RIDE</Button>
                        </Col>
                    </Row>
                  </Grid>
                   
                </div>

                <div id="driver-pax-end-action"  className="driver-pax-end-action shake-finish-ride">
                  <Grid fluid>
                  <Row>
                        <Col xs={3} sm={3} md={3}><Image src={this.state.userPic} height={35} circle></Image></Col>
                        <Col xs={3} sm={3} md={3}>{this.state.ridePrice + ' br'}</Col>
                        <Col xs={3} sm={3} md={3}>{this.state.rideDistance + ' km'}</Col>
                        <Col xs={3} sm={3} md={3}>{this.timeConvert(Number.parseInt(this.state.rideTime))}</Col>
                    </Row>
                    <Row>
                      <Col xs={6} sm={6} md={6}>
                       {this.state.rideUser}
                      </Col>
                      <Col xs={6} sm={6} md={6}>
                       {this.state.userMobile}
                      </Col>
                    </Row>
                    <Row>
                        <Col xs={12} sm={12} md={12}>
                          <Button  onClick={(e) => this.rideCompleted()} bsStyle="danger" bsSize="small" block>RIDE COMPLETED</Button>
                        </Col>
                    </Row>
                    <Row className="rowPadding">
                        <Col xs={12} sm={12} md={12}>
                          
                        </Col>
                    </Row>
                  </Grid>
                   
                </div>

                <div className="mapid" id="mapid"></div>
                
            </div>
        );
    }
}
export default DriverLocation;