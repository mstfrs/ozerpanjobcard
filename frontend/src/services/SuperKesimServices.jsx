const baseUrl = import.meta.env.VITE_BASE_URL;

// Tüm Super Kesim kayıtlarını getir
export const getAllSuperKesimRecords = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/resource/Super Kesim?fields=["name","machine_no","opt_no"]&filters=[["status","!=","Tamamlandı"]]`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Super Kesim Records Fetch Error:", error);
    throw error;
  }
};

// Super Kesim kaydını tamamla
export const completeSuperKesim = async (name) => {
  if (!name) {
    console.error("Name parameter is missing");
    throw new Error("Name is required");
  }


  try {
    const response = await fetch(
      `${baseUrl}/resource/Super Kesim/${encodeURIComponent(name)}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Tamamlandı"
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Complete failed:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error completing super kesim record:", error);
    throw error;
  }
};

//** PROFİL TEMIN */

export const getSuperKesimProfilDetails = async (name) => {
  if (!name) {
    console.error("Name parameter is missing");
    return null;
  }

  try {
    const response = await fetch(
      `${baseUrl}/resource/Super Kesim/${encodeURIComponent(name)}?fields=["*"]`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Super Kesim Details Fetch Error:", error);
    throw error;
  }
};

export const updateSuperKesimProfileList = async (id, payload) => {
  if (!id || !payload) {
    console.error("Missing parameters:", { id, payload });
    throw new Error("ID and payload are required");
  }


  try {
    const response = await fetch(
      `${baseUrl}/resource/Super Kesim Profile List/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Update failed:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating super kesim profile:", error);
    throw error;
  }
};

//** PROFİL TEMIN */

  