import React, { useState } from 'react';

import { PageLayout } from './components/PageLayout';
import { loginRequest } from './authConfig';
import { callMsGraph } from './graph';
import { ProfileData } from './components/ProfileData';

import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import './App.css';
import Button from 'react-bootstrap/Button';

/**
 * Renders information about the signed-in user or a button to retrieve data about the user
 */

const apiRequest = {
    scopes: ["api://7ed5f0c2-ab74-44a1-88dd-a66e0cc6c7b0/access_as_user"],
};

const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);

    function RequestProfileData() {
        // Silently acquires an access token which is then attached to a request for MS Graph data
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                callMsGraph(response.accessToken).then((response) => setGraphData(response));
            });
    }

    function callApi() {
        if (!accounts || accounts.length === 0) {
            console.error("No signed-in account");
            return;
        }

        instance
            .acquireTokenSilent({
                ...apiRequest,
                account: accounts[0],
                forceRefresh: true,
            })
            .then((response) => {
                const accessToken = response.accessToken;
                console.log(accessToken);

                fetch("https://your-api-endpoint.com/data", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        console.log("API response:", data);
                        alert("API call successful, check console for response.");
                    })
                    .catch((err) => {
                        console.error("API call failed", err);
                    });
            })
            .catch((err) => {
                console.error("Token acquisition failed", err);
            });
    }

    return (
        <>
            <h5 className="profileContent">Welcome {accounts[0].name}</h5>
            {graphData ? (
                <ProfileData graphData={graphData} />
            ) : (
                <>
                    <Button variant="secondary" onClick={RequestProfileData}>
                        Request Profile
                    </Button>
                    <Button variant="primary" onClick={callApi} style={{ marginLeft: '10px' }}>
                        Call Protected API
                    </Button>
                </>
            )}
        </>
    );
};

/**
 * If a user is authenticated the ProfileContent component above is rendered. Otherwise a message indicating a user is not authenticated is rendered.
 */
const MainContent = () => {
    return (
        <div className="App">
            <AuthenticatedTemplate>
                <ProfileContent />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <h5 className="card-title">Please sign-in to see your profile information.</h5>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default function App() {
    return (
        <PageLayout>
            <MainContent />
        </PageLayout>
    );
}
