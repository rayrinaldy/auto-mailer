import ora from 'ora';
import nodemailer from 'nodemailer';
import config from '../config';

// Emails credentials
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.gmail.username,
        pass: config.gmail.password
    }
});

export function sendEmail(to, text, attachment) {
    const spinner = ora().start('Sending email');
            
    let options = {
        from: 'Ray',
        to: to,
        cc: 'rayrinaldy@gmail.com',
        subject: 'Hello From Dropee',
        text: text,
    };

    if(attachment === '') {
        options.attachments = [{
            filename: 'Attachment.pdf',
            content: attachment
        }]
    }
    
    // Sending email
    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log(error);
            spinner.fail('Failed to send email!');
        } else {
            spinner.succeed('Email sent successfully to ' + info.envelope.to[0]);
        }
    });
}