import api from "./client";

interface CreateUserRequest {

    email: string;

    password: string;

}

interface CreateUserResponse {

    uid: string;

    email: string;

}

export const createUser = async (
    data: CreateUserRequest
): Promise<CreateUserResponse> => {

    const response = await api.post<CreateUserResponse>(
        "/auth/create-user",
        data
    );

    return response.data;

};