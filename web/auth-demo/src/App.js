import React from 'react';
import Amplify from 'aws-amplify';
import {withAuthenticator} from 'aws-amplify-react';
import './App.css';
import Login from "./components/Login";
import {BrowserRouter, Switch, Route, Redirect} from "react-router-dom";
import Loadable from "react-loadable";

Amplify.configure({
    Auth: {
        region: '__(AWS_REGION)__',
        userPoolId: '__(USERPOOL_ID)__',
        userPoolWebClientId: '__(CLIENT_ID)__',
        cookieStorage: {
            domain: '__(CF_DOMAIN_NAME)__',
            path: '/',
            expires: 30,
            secure: true
        },
    }
});

const LoadableProtected = Loadable({
    loader: () => import(/* webpackChunkName: "protected/a" */ "./components/Protected"),
    loading() {
        return <div>Loading...</div>
    }
});

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact render={() => <Redirect to="/login"/>}/>
                    <Route path="/login" exact render={() => <Login/>}/>
                    <Route path="/protected" exact component={withAuthenticator(LoadableProtected)}/>
                </Switch>
            </BrowserRouter>
        </div>
    );
}

export default App;
