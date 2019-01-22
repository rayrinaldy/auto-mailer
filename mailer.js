'use strict';

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import csv from "csvtojson";
import ora from 'ora';
import config from './config';
import { google } from 'googleapis';
import { authorize, getAccessToken } from './lib/drive';

// Absolute path to our app directory
const ABSPATH = path.dirname(process.mainModule.filename); 


// Get CSV file to extract data
const csvFilePath = './mail.csv';

// Test Template
const htmlTemplate = fs.createReadStream(ABSPATH + '/views/hakama_template.html',{encoding:'utf-8'});

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
const mailgunAuth = {
    auth: {
        api_key: config.mailgun.api_key,
        domain: config.mail.domain
    },
}

// Emails credentials (Choose between normal GMAIL or MAILGUN)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: config.dropee.user, 
        clientId: config.dropee.clientId,
        clientSecret: config.dropee.clientSecret,
        refreshToken: config.dropee.refreshToken,
        expires: 1484314697598
    }
});

const mailgunTransporter = nodemailer.createTransport(mg(auth));


// // Gonna change this to CSV later
// let mailList = [{
//     mail: 'rayrinaldy@gmail.com',
//     text: 'Test Automation Mail With Attachments',
//     attachments: 'https://drive.google.com/file/d/0BzdGvyU-5w7ic3RhcnRlcl9maWxlX2Rhc2hlclYw/view?usp=sharing'
// }]

csv()
    .fromFile(csvFilePath)
    .then((mailList)=>{
        // If attachment folder is not exist, create one
        if (!fs.existsSync(ABSPATH + '/attachments')) {
            const spinner = ora().start('No folder found!');
            fs.mkdirSync(ABSPATH + '/attachments');
            spinner.succeed('Folder created');
        }
        
        // Let the loop begin
        mailList.forEach((el, i) => {
            if(!el.attachments) { // Check if attachment exist or not
                let mail = el.mail;
                // let text = el.text;
        
                try {
                    const spinner = ora().start('Sending email');
                    
                    let options = {
                        from: '"Hakama Clothing" <hakamaclothing@gmail.com>',
                        to: mail,
                        subject: 'Halo dari Hakama!',
                        // text: text,
                        html: htmlTemplate
                    };
        
                    transporter.sendMail(options, (error, info) => {
                        if (error) {
                            console.log(error);
                            spinner.fail('Failed to send email!');
                        } else {
                            spinner.succeed('Email sent successfully to ' + info.envelope.to[0]);
                        }
                    });
                } catch (error) {
                    console.log(error)            
                }
            } else {
                fs.readFile('credentials.json', (err, content) => {
                    if (err) return console.log('Error loading client secret file:', err);
            
                    const spinner = ora().start('Downloading file');
            
                    // Authorize a client with credentials, then call the Google Drive API.
                    authorize(JSON.parse(content), downloadFile);
            
                    spinner.stop();
                    spinner.succeed('File Downloaded');
                });
            
                function downloadFile(auth) {
                    const drive = google.drive({
                        version: 'v3',
                        auth
                    });
            
                    let fileId = el.attachments.match(/[-\w]{25,}/);
                    let dest = fs.createWriteStream(ABSPATH + '/attachments/document_' + i + '.pdf');
            
                    drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    }, {
                        responseType: 'stream'
                    }, (err, res) => {
                        res.data
                            .on('end', () => {
                                let mail = el.mail;
                                let text = el.text;
                                let attachment = fs.createReadStream(ABSPATH + '/attachments/document_' + i + '.pdf');
            
                                try {
                                    sendEmail(mail, text, attachment);
                                } catch (error) {
                                    console.log(error);
                                }
                            })
                            .on('error', err => {
                                console.log('Error', err);
                            })
                            .pipe(dest);
                    })
                }
            }
        
        })

        const sendEmail = (to, text, attachment) => {
            const spinner = ora().start('Sending email');
                    
            let options = {
                from: '"Dropee" <ray@dropee.com>',
                to: to,
                cc: 'rayrinaldy@gmail.com',
                subject: 'Hello From Dropee',
                text: text,
                attachments: [{
                    filename: 'Attachment.pdf',
                    content: attachment
                }]
            };
            
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
    })
