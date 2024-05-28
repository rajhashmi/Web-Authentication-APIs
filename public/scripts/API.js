const API = {
    endpoint: "/auth/",
    // ADD HERE ALL THE OTHER API FUNCTIONS
    login: async (user) => {
        return await API.makePostRequest(API.endpoint + "login", user);
    },
    register: async (user) => {
        return await API.makePostRequest(API.endpoint + "register", user);
    },
    loginFromGoogle: async (data) => {
        return await API.makePostRequest(API.endpoint + "login-google", data);
    },
    makePostRequest: async (url, data) => {
        try {
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            return  response;
        } catch (error) {
            console.log(error);
        }
    }

}

export default API;
