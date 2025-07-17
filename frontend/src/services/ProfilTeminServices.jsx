const baseUrl = import.meta.env.VITE_BASE_URL;


export const updateProfileStockLedgerQty = async (profile_type, length, qty,opt_no) => {
  if (!profile_type || !length || qty === undefined) {
    console.error("Missing parameters:", { profile_type, length, qty });
    throw new Error("profile_type, length, and qty are required");
  }

  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.create_profile_exit`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile_type, length, qty ,opt_no}),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Update failed:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error updating profile stock ledger qty:", error);
    throw error;
  }
};


  