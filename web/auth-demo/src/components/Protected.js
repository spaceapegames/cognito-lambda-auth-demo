import React, {useEffect, useState} from "react";
import { Auth } from 'aws-amplify';
import {withRouter} from "react-router-dom";
import axios from "axios";

const BASE_URI = "https://z7d7meaf49.execute-api.us-east-1.amazonaws.com/Prod";

const callBackend = async () => {
    let session = await Auth.currentSession();
    return axios.get(`${BASE_URI}/helloWorld`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': session.idToken.jwtToken
        }
    });
};

const Protected = ({history}) => {
    const [message, setMessage] = useState("");

    useEffect(() => {
        callBackend().then(m => setMessage(m.data))
            .catch(e => { console.log(e)});
    }, []);
  return (
      <div>
          <h1>Welcome to the Protected Zone!</h1>
          <button onClick={() => Auth.signOut()
              .then(history.push("/login"))
              .catch(e => console.log(e))}>Sign Out</button>
          <h2>Message from the Backend: {message}</h2>
      </div>
  )
};

export default withRouter(Protected);