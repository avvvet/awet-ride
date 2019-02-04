import React, { Component } from 'react';
import { render } from 'react-dom';
import { Grid, Message, Button, Image } from 'semantic-ui-react'
import $ from 'jquery';
class MissedRide extends Component {
    constructor() {
       super();

       this.state = {
        _show_confirm : true,
        _show_reason : false,
        _reason : ''
       }

    }

    _yes = (e) => {
       this.setState({
         _show_confirm : false,
        _show_reason : true
       })
    }

    _no = (e) => {
        render('',document.getElementById('driver-ride-cancel'));
    }

    confirm_missed_ride = (e) => {
        let data = {};
        e.target.disabled = true;
        $.ajax({ 
            type:"POST",
            url:"/driver/ready_for_work",
            headers: { 'x-auth': sessionStorage.getItem("_auth_driver")},
            data: JSON.stringify(data), 
            contentType: "application/json",
            success: (_ride) => {
                if(_ride[0] === 1){
                    document.getElementById('missed-ride').style.visibility="hidden"; 
                    render('',document.getElementById('missed-ride'));
                    e.target.disabled = false;
                } else {
                    render('error, not updated',document.getElementById('missed-confirm-error')); 
                }
            },
            error: function(xhr, status, err) {
                render('error, try again',document.getElementById('missed-confirm-error'));
            }.bind(this)
        });  
    }


    render(){
        return(
            <div>
                <Message success>
                 <Message.Header>You Missed a ride !</Message.Header>
                    <p>
                        This will affect customer and our work. Please 
                        remind repeated missed ride will lead to closing
                        your account.
                    </p>

                    <p>
                       <h3>Are you ready to work now ?</h3>
                    </p>
                    <p>
                        <Grid columns={2}>
                            <Grid.Row>
                                <Grid.Column mobile={8} tablet={8} computer={8}> 
                                    <Button color="green" onClick={(e) => this.confirm_missed_ride(e)} fluid>YES</Button>
                                </Grid.Column>
                                <Grid.Column mobile={8} tablet={8} computer={8}> 
                                    <Button color="grey" onClick={(e) => this.onVarify(e)} fluid>NO</Button>
                                </Grid.Column>
                            </Grid.Row>

                            <Grid.Row>
                                <Grid.Column mobile={16} tablet={16} computer={16}>
                                    <div className="div-error" id="missed-confirm-error"></div>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </p>
                </Message>
            </div>
        );
    }
}
export default MissedRide;