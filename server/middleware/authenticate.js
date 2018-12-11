const jwt = require('jsonwebtoken');
const models = require('../models');

var authenticate = (req, res, next) => {
    var token = req.header('x-auth');
    var decoded;
    
    try {
         decoded = jwt.verify(token, 'JESUSMYHEALER');
         models.drivers.findOne({ where: {email: decoded} }).then(driver => {
           if(!driver) {
             res.send(401).send();
           }
             
           req.driver = driver;
           req.token = token;
           next();
         });
     } catch (e) {
       res.status(401).send();
     }
};

module.exports = {authenticate};