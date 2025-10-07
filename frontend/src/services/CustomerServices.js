export const searchCustomers = async ({ searchText = '', page = 0, pageSize = 20 } = {}) => {
	try {
		const params = new URLSearchParams();
		params.set(
			'fields',
			JSON.stringify(['name', 'customer_name', 'customer_group'])
		);
		params.set('limit_start', String(page * pageSize));
		params.set('limit_page_length', String(pageSize));
		if (searchText && searchText.trim()) {
			params.set(
				'or_filters',
				JSON.stringify([
					['name', 'like', `%${searchText}%`],
					['customer_name', 'like', `%${searchText}%`],
				])
			);
		}
		const response = await fetch(`/api/resource/Customer?${params.toString()}`);
		const data = await response.json();
		return {
			items: data?.data || [],
			hasMore: (data?.data || []).length === pageSize,
		};
	} catch (error) {
		console.error('Customer search error:', error);
		return { items: [], hasMore: false };
	}
}; 