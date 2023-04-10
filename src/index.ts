import {
    TelegramClient,
} from 'telegram';
import {
    StringSession
} from 'telegram/sessions';
import * as fs from 'fs';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import * as gpt from 'gpt4all';
import { input } from './util';

// auth.txt check
if (!fs.existsSync(process.cwd() + '/auth.txt')) {
    fs.writeFileSync(process.cwd() + '/auth.txt', '');
}

const apiId = parseInt(process.env.TG_API_ID || '0');
const apiHash = process.env.TG_API_HASH;
const stringSession = new StringSession(fs.readFileSync(process.cwd() + '/auth.txt').toString()); // fill this later with the value from session.save()
const gpt4all = new gpt.GPT4All('gpt4all-lora-unfiltered-quantized', true);

(async () => {
    if (!apiId || !apiHash) throw new Error('Please provide api id and hash');

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text('Please enter your phone number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });
    console.log('You should now be connected. Please save the below token to auth.txt');
    console.log(client.session.save()); // Save this string to avoid logging in again

    await gpt4all.init(false);

    client.addEventHandler(messageHandler, new NewMessage({}));
})();

async function messageHandler(event: NewMessageEvent) {
    let content = event.message.message;

    let cmd = content.split(' ')[0];

    switch (cmd) {
        case 'askgpt':
            const query = content.replace('askgpt', '');
        
            const msg = await event.message.respond({
                message: `> ${query}\nThinking...`,
            });
            
            if (!msg) return false;
            
            await gpt4all.open();
            
            const response = await gpt4all.prompt(query);
            await msg.edit({
                text: `> ${query}\n${response}`,
            });

            gpt4all.close();
            break;

        case 'ping':
            await event.message.respond({
                message: `pong`
            });
            break;

        default:
            break;
    }
}

