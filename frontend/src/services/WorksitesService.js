export const listWorksites = async () => {
	try {
		const params = new URLSearchParams();
		params.set(
			"fields",
			JSON.stringify([
				"name",
				"worksite_name",
				"status",
				"assigned_dealer",
				"next_action_date",
				"expected_value",
				"custom_offer",
				"latitude",
				"longitude",
				"attach_image_aeci",
				"custom_sales_person",
				"contact_person",
				"contact_phone",
				"contact_email",
			])
		);
		params.set("order_by", "modified desc");
		const response = await fetch(`/api/resource/Worksites?${params.toString()}`);
		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error("Worksites list fetch error:", error);
	}
};

export const getWorksiteDetail = async (name) => {
	try {
		const response = await fetch(`/api/resource/Worksites/${encodeURIComponent(name)}`);
		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error("Worksite detail fetch error:", error);
	}
};

export const createWorksite = async (payload) => {
	try {
		const response = await fetch("/api/resource/Worksites", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: payload }),
		});
		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error("Worksite create error:", error);
	}
};

export const updateWorksite = async (name, payload) => {
	try {
		const response = await fetch(`/api/resource/Worksites/${encodeURIComponent(name)}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: payload }),
		});
		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error("Worksite update error:", error);
	}
};

export const deleteWorksite = async (name) => {
	try {
		const response = await fetch(`/api/resource/Worksites/${encodeURIComponent(name)}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		return true;
	} catch (error) {
		console.error("Worksite delete error:", error);
	}
};

export const uploadFile = async (file) => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('is_private', '0');
		// Optionally: formData.append('folder', 'Home');
		const response = await fetch('/api/method/upload_file', {
			method: 'POST',
			body: formData,
		});
		const data = await response.json();
		return data?.message?.file_url;
	} catch (error) {
		console.error('Upload file error:', error);
	}
}; 