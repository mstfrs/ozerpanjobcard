const baseUrl = import.meta.env.VITE_BASE_URL;

export const getLoggedUserEmployeeDetails = async (currentUser) => {
    try {
        // Kullanıcının e-posta adresine göre Employee ID'sini al
        const employeeResponse = await fetch(
            `${baseUrl}/resource/Employee?filters=[["user_id","=","${currentUser}"]]`,
            {
                method: "GET",
                credentials: 'include',
            }
        );

        if (!employeeResponse.ok) {
            throw new Error("Failed to fetch employee ID");
        }

        const employeeData = await employeeResponse.json();
        const employeeId = employeeData.data.length > 0 ? employeeData.data[0].name : null;

        if (!employeeId) {
            console.log("No employee found for this user.");
            return null;
        }

        // Employee ID ile Employee detaylarını al
        const detailsResponse = await fetch(
            `${baseUrl}/resource/Employee/${employeeId}`,
            {
                method: "GET",
                credentials: 'include',
            }
        );

        if (!detailsResponse.ok) {
            throw new Error("Failed to fetch employee details");
        }

        const employeeDetails = await detailsResponse.json();
        return employeeDetails.data; // Sonucu döndür
    } catch (error) {
        console.error("Error:", error.message);
        return null; // Hata durumunda null döndür
    }
};
