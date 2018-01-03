
var nodemailer = require('nodemailer');

function sendMail(recipientAddress, subject, body) {
  var smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'tom.muller44444@gmail.com',
      pass: 'tahseen88'
    }
  };
            
  var transporter = nodemailer.createTransport(smtpConfig);
  var mailOptions = {
    from: '"Devugees Shop" <tom.muller44444@gmail.com>',
    to: recipientAddress,
    subject: subject,
    text: body,
    html: body
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if(err)
      console.log('mail was not delivered');
  }); 
}

module.exports.sendMail = sendMail;
 console.log(sendMail.host);