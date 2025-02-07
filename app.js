(async function main() {
    const APP_TOKEN = "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";
    const STORE_MYSHOPIFY_DOMAIN = "anatta-test-store";
    const API_VERSION = "2025-01";

    const queryShopifyGQL = async (store, payload) => {
        try {
            const url = `https://${store}.myshopify.com/admin/api/${API_VERSION}/graphql.json`;
            let myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("X-Shopify-Access-Token", APP_TOKEN);

            let requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(payload),
                redirect: 'follow'
            };

            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const dataJSON = await response.json();

            if (dataJSON.errors || (dataJSON.data && dataJSON.data.userErrors && dataJSON.data.userErrors.length > 0)) {
                throw new Error(`GraphQL Error: ${JSON.stringify(dataJSON.errors || dataJSON.data.userErrors)}`);
            }

            return dataJSON.data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const productsQuery = (titleQuery) => `query {
        products(first: 50, query: "title:${titleQuery}*") {
            nodes {
                title
                variants(first: 50){
                    nodes {
                        title
                        price
                    }
                }
            }
            pageInfo {
                hasNextPage
            }
        }
    }`;

    const args = process.argv.slice(2);
    if (args[0] === '--name' && args[1]) {
        const titleSearchArgument = args[1];
        const queryData = await queryShopifyGQL(STORE_MYSHOPIFY_DOMAIN, { query: productsQuery(titleSearchArgument) });
        if (queryData.products.nodes.length) {
            const productsToDisplay = [];
            queryData.products.nodes.forEach(node => {
                node.variants.nodes.forEach(variant => productsToDisplay.push({ productTitle: node.title, variantTitle: variant.title, price: variant.price }))
            })
            productsToDisplay.sort((a, b) => a.price - b.price).forEach(({ productTitle, variantTitle, price }) => console.log(`${productTitle} - variant ${variantTitle} - price $${parseInt(price)}`))
        } else {
            console.error("Query didn't return any products.")
        }

    } else {
        console.error("Argument --name not provided.")
        return;
    }

})();