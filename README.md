# Bedrock-Socket
This is a combination of <b>BDS server</b> and <b>websocket</b>. You can view every log output from BDS server on other platforms through websocket client. Although the BDS server doesn't generate chat logs like the Java server, allowing you to view in-game chat content, I've created a dedicated `chatReceiver` add-on. This add-on will automatically extract the content when the program is run.

## System Requirements
- Nodejs V.20 or greater.
- Windows/linux OS (can be regular or server).
- The minecraft system requirement based on [Minecraft official website](https://www.minecraft.net/en-us/download/server/bedrock#description-list-a-acdf7c9ba3).
<br>


## Instalation
install dependencies: 

```shell
$ git clone https://github.com/Keito-Klein/Bedrock-Socket
$ cd Bedrock-Socket
$ npm install
```
Then, edit BDS server configuration on `.env` file, and finally run the program
```shell
$ npm start
```
<br>

***if you found error like this on initial run. This is normal, the script will automatically fix for you. Just restart the server***
```shell
[YYYY-MM-DD HH:mm:ss:ms ERROR] [Scripting] Plugin [Chat_Receiver - 1.0.0] - failed to create context.

[YYYY-MM-DD HH:mm:ss:ms ERROR] [Scripting] Plugin [Chat_Receiver] - module [Chat_Receiver - 1.0.0] requested invalid version [2.3.0-beta] of [@minecraft/server].

Current [beta] version is [2.4.0-beta].

Available versions:
0.1.0
1.19.0
2.3.0
2.4.0-beta
3.0.0-alpha

[YYYY-MM-DD HH:mm:ss:ms ERROR] [Scripting] Plugin [Chat_Receiver - 1.0.0] - run failed, no runtime or context available
```
