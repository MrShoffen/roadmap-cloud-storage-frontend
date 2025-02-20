import {API_REGISTRATION} from "../../../UrlConstants.jsx";
import {throwSpecifyException} from "../../../exception/ThrowSpecifyException.jsx";


export const sendRegistrationForm = async (registrationData) =>{

    console.log("Запрос на регистрацию: " + registrationData);


    const response = await fetch(API_REGISTRATION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',

        body: JSON.stringify(registrationData),
    });

    console.log("Ответ на запрос о регистрации: ");
    console.log(response);
    if (!response.ok) {
        console.log("Ошибка со статусом: " + response.status);
        const errorMessage = await response.json();
        throwSpecifyException(response.status, errorMessage);
    }

    return await response.json(response);
}