const WebSocket = require('ws');
const uuid = require('uuid');        // For later use
const fs = require('fs');
const config = require("./config.json");
const discord = require('discord.js');
const client = new discord.Client({
    intents: new discord.Intents(32767),
    ws: { properties: { $browser: "Discord iOS" } }
});

const port = 5151;

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

// Create a new websocket server on port 3000
console.log(`Ready. On MineCraft chat, type /connect localhost:${port}`);
const wss = new WebSocket.Server({ port: port });

pos = {}

const prefix = ":[kuwaSYSTEM]";

// On Minec raft, when you type "/connect localhost:3000" it creates a connection

client.on('ready', async() => {
  console.log("BOT logined to discord");
  let guildNum = 0;
  let channelNum = 0;
  client.guilds.cache.forEach(() => guildNum++); //bot参加サーバー数
  client.channels.cache.forEach(() => channelNum++); //参加しているサーバーにあるすべてのチャンネル数
  console.log(`GUILDnum: ${guildNum} CHANNELnum: ${channelNum}`);
});


wss.on('connection', socket => {
  console.log('Connected');
  socket.send(JSON.stringify({
    "header": {
      "version": 1,                     // We're using the version 1 message protocol
      "requestId": uuid.v4(),           // A unique ID for the request
      "messageType": "commandRequest",  // This is a request ...
      "messagePurpose": "subscribe"     // ... to subscribe to ...
    },
    "body": {
      "eventName": "PlayerMessage"      // ... all player messages.
    },
  }));
  {
  socket.send(JSON.stringify({
    "header": {
      "version": 1,
      "requestId": uuid.v4(),
      "messageType": "commandRequest",
      "messagePurpose": "subscribe"
    },
    "body": {
      "eventName": "PlayerJoin"
    },
  }));
  socket.send(JSON.stringify({
    "header": {
      "version": 1,
      "requestId": uuid.v4(),
      "messageType": "commandRequest",
      "messagePurpose": "subscribe"
    },
    "body": {
      "eventName": "PlayerTransform"
    },
  }));
  }

  //   socket.on('message', packet => {
  //     const msg = JSON.parse(packet)
  //     console.log(msg)
  //   })

  async function sendCommand(uuid,cmd) {
    const msg = {
      "header": {
        "version": 1,
        "requestId": uuid,     // Send unique ID each time
        "messagePurpose": "commandRequest",
        "messageType": "commandRequest"
      },
      "body": {
        "version": 1,               // TODO: Needed?
        "commandLine": cmd,         // Define the command
        "origin": {
          "type": "player"          // Message comes from player
        }
      }
    }
    return await new Promise((resolve, reject) => {
      socket.send(JSON.stringify(msg))  // Send the JSON string
      resolve()
      }).then(()=>{
        return
      });
  }

  client.on("messageCreate", async(message) => {
    if(message.channel.id != config.messageChannelId){return}
    sendCommand(uuid.v4(), `say ${message.channel.name} <${message.author.username}> ${message.content}`);
  });


  socket.on('message', async packet => {
    const packetJson = JSON.parse(packet)
    const messagePurpose = packetJson.header.messagePurpose
    // console.log(packetJson)
    // If this is a chat window
    if (messagePurpose === 'event') {
      const event = packetJson.header.eventName;
      if (event === 'PlayerMessage') {
        const msg = packetJson.body.message
          // ... and it's like "pyramid 10" (or some number), draw a pyramid
          if(msg.startsWith(".gmc")){
            sendCommand(uuid.v4(),"gamemode c @s")
          }
          else if(msg.startsWith(".gms")){
            sendCommand(uuid.v4(),"gamemode s @s")
          }
          else if(msg.startsWith(".gma")){
            sendCommand(uuid.v4(),"gamemode a @s")
          }
          else if(msg.startsWith(".m")){
            try {
              const guild = await client.guilds.fetch(config.guildId);
              const channel = await guild.channels.fetch(config.messageChannelId);
              const voice = await guild.channels.fetch(config.voiceChannelId);
              voice.members.each(async(user) => {
                user.voice.setMute(true);
              });
              sendCommand(uuid.v4(),`say ${prefix} ボイスチャットのメンバーをミュートしました`);
            } catch(e) {
              console.error("------ERROR-----");
              console.error(e);
              sendCommand(uuid.v4(),`say ${prefix} ${e}`);
            }
          }
          else if(msg.startsWith(".um")){
            try {
              const guild = await client.guilds.fetch(config.guildId);
              const channel = await guild.channels.fetch(config.messageChannelId);
              const voice = await guild.channels.fetch(config.voiceChannelId);
              voice.members.each(async(user) => {
                user.voice.setMute(false);
              });
              sendCommand(uuid.v4(),`say ${prefix} ボイスチャットのメンバーのミュートを解除しました`);
            } catch(e) {
              console.error("------ERROR-----");
              console.error(e);
              sendCommand(uuid.v4(),`say ${prefix} ${e}`);
            }
          }else if(msg.startsWith(".vl")){
            try {
              const guild = await client.guilds.fetch(config.guildId);
              const channel = await guild.channels.fetch(config.messageChannelId);
              const voice = await guild.channels.fetch(config.voiceChannelId);
              voice.members.each(async(user) => {
                console.log(user.displayName)
              });
              sendCommand(uuid.v4(),`say ${prefix} ボイスチャットのメンバーのミュートを解除しました`);
            } catch(e) {
              console.error("------ERROR-----");
              console.error(e);
              sendCommand(uuid.v4(),`say ${prefix} ${e}`);
            }
          }

          

      }else if (event === 'PlayerTransform') {

      }

    }else if (messagePurpose === 'commandResponse') {
      if (packetJson.body.statusCode == 0){
        const statusMessage = packetJson.body.statusMessage;
        let statusList = String(packetJson.body.statusMessage).split(" ");
        if (statusMessage?.startsWith("???")) {
          return
        }
      }
    }
  });
});

client.login(config.token);