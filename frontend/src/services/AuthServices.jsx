const baseUrl = import.meta.env.VITE_BASE_URL;

export const fetchCurrentUser = async () => {
    try {
        const response = await fetch(`${baseUrl}/method/frappe.auth.get_logged_user`, {
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            const  message  = await response.json();
            
            return message;
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error("Hata:", error);
    }
};
