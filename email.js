const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return process.exit(1);
    }

    console.log('Credentials obtained, sending message...');

    // Create a SMTP transporter object
    let transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
    transporter.use('compile', hbs ({
        viewPath: 'templates',
        extName: '.hbs'
    }));

    let message = {
        from: 'allen3just@yahoo.com',
        to: 'example@example.com',
        subject: 'Notification email',
        template: 'notification'
    };

    transporter.sendMail(message, (err, info) => {
        if (err) {
            console.log('Error occurred. ' + err.message);
            return process.exit(1);
        }

        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
});
