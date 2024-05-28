import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import * as url from 'url';
import bcrypt from 'bcryptjs';
import * as jwtJsDecode from 'jwt-js-decode';
import base64url from "base64url";
import SimpleWebAuthnServer from '@simplewebauthn/server';
import { ok } from 'assert';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express()
app.use(express.json())

const adapter = new JSONFile(__dirname + '/auth.json');
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] }

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// ADD HERE THE REST OF THE ENDPOINTS

function findUser(email){
  console.log(db);
  const result = db.data.users.filter(u => u.email === email);
  if(result.length===0)return undefined;
  return result[0];
}

app.post("/auth/login-google", (req, res) => {
  let jwt = jwtJsDecode.jwtDecode(req.body.credential);
  let payload = jwt.payload;
  let user = {
      email: payload.email,
      name: payload.given_name + " " + payload.family_name,
      password: false        
  }
  const userFound = findUser(req.body.email);

  if (userFound) {
      user.google = payload.aud;
      db.write();
      res.send({ok: true, name: user.name, email: userFound.email});    
  } else {
      db.data.users.push({
          ...user,
          federated: {
              google: payload.aud,
          }
      });
      db.write();
      res.send({ok: true, name: user.name, email: user.email});

  }
});

app.post("/auth/login", (req, res) => {
  const user = findUser(req.body.email);
  if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
          res.send({ok: true, email: user.email, name: user.name});
      } else {
          res.send({ok: false, message: 'Data is invalid'});            
      }
  } else {
      res.send({ok: false, message: 'Data is invalid'});
  }
});

app.post("/auth/register", (req, res) => {
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(req.body.password, salt);

  const user = {
      name: req.body.name,
      email: req.body.email,
      password: hash
  };
  const userFound = findUser(req.body.email);

  if (userFound) {
      res.send({ok: false, message: 'User already exists'});
  } else {
      db.data.users.push(user);
      db.write();
      res.send({ok: true});
  }
});

app.get("*", (req, res) => {
    res.sendFile(__dirname + "public/index.html"); 
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

