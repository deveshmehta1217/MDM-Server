import { google } from 'googleapis';
import { promises as fs } from 'fs';
import readline from 'readline';
import path from 'path';

const TOKEN_PATH = path.resolve('google_drive_token.json');
const CREDENTIALS_PATH = path.resolve('google_drive_credentials.json');

// Authenticate and save tokens
const authenticateGoogleDrive = async () => {
    try {
        const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
        const { client_id, client_secret, redirect_uris } = credentials.web;

        const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const authUrl = auth.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file']
        });

        console.log('Authorize this app by visiting this URL:', authUrl);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter the code from that page here: ', async (code) => {
            rl.close();
            const { tokens } = await auth.getToken(code);
            auth.setCredentials(tokens);

            // Save tokens to file
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log('Tokens saved to', TOKEN_PATH);
        });
    } catch (error) {
        console.error('Failed to authenticate Google Drive:', error);
    }
};

authenticateGoogleDrive();
