'use strict';

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import csvtojson from "csvtojson";
import config from './config';
import { google } from 'googleapis';
import { authorize, getAccessToken } from './lib/drive';
const ABSPATH = path.dirname(process.mainModule.filename); // Absolute path to our app directory

// Emails credentials
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.gmail.username,
        pass: config.gmail.password
    }
});

// Gonna change this to CSV later
let mailList = [{
    mail: 'ray@dropee.com',
    text: 'Test Automation Mail 123',
    attachments: 'https://drive.google.com/file/d/0BzdGvyU-5w7ic3RhcnRlcl9maWxlX2Rhc2hlclYw/view?usp=sharing'
}]

// If attachment folder is not exist, create one
if (!fs.existsSync(ABSPATH + '/attachments')) {
    fs.mkdirSync(ABSPATH + '/attachments');
    console.log('No folder found! Folder created')
}

// Let the loop begin
mailList.forEach((el, i) => {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), downloadFile);
        console.log('File Downloaded')
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
                    const options = {
                        from: 'Ray',
                        to: el.mail,
                        cc: 'rayrinaldy@gmail.com',
                        subject: 'Hello From Dropee',
                        text: el.text,
                        attachments: [{
                            filename: 'Attachment.pdf',
                            content: fs.createReadStream(ABSPATH + '/attachments/document_' + i + '.pdf')
                        }]
                    };
                    
                    // Sending email
                    transporter.sendMail(options, (error, info) => {
                        if (error) {
                            console.log(error, 'XXXXXXX')
                        } else {
                            console.log('Email Sent Successfully')
                        }
                    });
                })
                .on('error', err => {
                    console.log('Error', err);
                })
                .pipe(dest);
        })
    }
})
