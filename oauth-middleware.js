'use strict';

const superagent = require('superagent');
const users = require('./users.js');

const tokenServerUrl = 'https://accounts.google.com/o/oauth2/v2/auth'; // api endpoint for getting a token
const CLIENT_ID = '444667393820-6rpjjjaepv6lu63oecpe61e6698bd01s.apps.googleusercontent.com';
const CLIENT_SECRET = 'M_xA5KS1W5S4B09Zdr7YmrVb';
const API_SERVER = 'http://localhost:3000/oauth';

module.exports = async function authorize(req, res, next) {
  // in here we will do the handshake
  // 1 - pop up a login/signup screen from github
  // 2 - make a request to github with a "code" that comes from that popup
  // 3 - github will respond with a token
  // 4 - send that token back to github (remoteAPI) and github will respond with user details
  // 5 - save the user and generate a user token

  try {
    const code = req.query.code;
    let remoteToken = await exchangeCodeForToken(code);
    console.log('__Google TOKEN__:', remoteToken);
    next();
  } catch (err) {
    next(`Error: ${err}`);
  }
};

async function exchangeCodeForToken(code) {
  console.log('code', code);
  let tokenResponse = await superagent.post('https://www.googleapis.com/oauth2/v4/token').type('form').send({
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: API_SERVER,
    grant_type: 'authorization_code',
    // response_type: 'token',
    // scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
    // include_granted_scopes: true,
    // state: 'pass-through value',
  });

  console.log(tokenResponse.body);

  let access_token = tokenResponse.body.access_token;
  return access_token;
}

// this will use the user api endpoint to get user info/repo info
async function getRemoteUserInfo(token) {
  // this will use the access token to get user details
  let userResponse = await superagent
    .get(remoteAPI)
    .set('user-agent', 'express-app')
    .set('Authorization', `token ${token}`);

  let user = userResponse.body;
  return user;
}

function getURL() {
  return document.URL;
}

async function getUser(remoteUser) {
  // this will actually save the user to the db and return user details from the db
  let userRecord = {
    username: remoteUser.login,
    password: 'canbeanything',
  };

  let user = await users.save(userRecord);
  // this is meant for us to generate a final user token to access routes in our app
  // tomorrow: this is will be used in the format of a Bearer Authentication Token
  let token = users.generateToken(user);

  return [user, token];
}
