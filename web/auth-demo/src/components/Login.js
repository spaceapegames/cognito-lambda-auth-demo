import React, {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {Redirect} from "react-router-dom";
import { Auth } from 'aws-amplify';


const Login = ({history}) => {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        Auth.currentAuthenticatedUser()
            .then(setLoggedIn(true))
            .catch(setLoggedIn(false))
    }, []);

    return (
        <div>
        { loggedIn ?
            <Redirect to='/protected' />
                :
            <div>
                <h1>Please Login To Continue</h1>
                <button onClick={() => history.push(`/protected`)}>Sign In</button>
            </div>


        }
        </div>

    )
};

export default withRouter(Login);