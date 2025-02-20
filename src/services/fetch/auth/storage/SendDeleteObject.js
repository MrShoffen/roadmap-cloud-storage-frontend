import {API_FILES} from "../../../../UrlConstants.jsx";
import {throwSpecifyException} from "../../../../exception/ThrowSpecifyException.jsx";


export const sendDeleteObject = async (objectName) => {

    console.log("Удаляем объект: " + objectName);

    const params = new URLSearchParams({path: objectName});

    const url = `${API_FILES}?${params.toString()}`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    });

    console.log("Ответ: ", response);

    if (!response.ok) {
        const error = await response.json();
        throwSpecifyException(response.status, error);
    }

    return await response.json();

}