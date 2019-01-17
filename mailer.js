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

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

if (!fs.existsSync(ABSPATH + '/attachments')) {
    fs.mkdirSync(ABSPATH + '/attachments');
    console.log('Folder Created')
}

const start = async () => {
    asyncForEach(mailList, async (el, i) => {
        // Load client secrets from a local file.
        await fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Drive API.
            authorize(JSON.parse(content), downloadFile);
            console.log('FIle Downloaded')
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
                        console.log('Done');
                    })
                    .on('error', err => {
                        console.log('Error', err);
                    })
                    .pipe(dest);
            })
        }
    
        await console.log('done')
    
        // const options = {
        //     from: 'Ray',
        //     to: el.mail,
        //     cc: 'rayrinaldy@gmail.com',
        //     subject: 'Hello From Dropee',
        //     text: el.text,
        //     attachments: [{
        //         filename: 'Attachment.pdf',
        //         content: fs.createReadStream(ABSPATH + '/attachments/document_' + i + '.pdf')
        //     }]
        // };
    
        // transporter.sendMail(options, (error, info) => {
        //     if (error) {
        //         console.log(error, 'XXXXXXX')
        //     } else {
        //         console.log(info)
        //     }
        // });
    
    })
    
    console.log('Done');
}

start();


// Let the loop begin