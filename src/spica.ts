import axios from "axios";

export async function makeSpicaRequest(
  method: string,
  endpoint: string,
  data?: any
) {
  const baseUrl = process.env.SPICA_URL || "";
  const authKey = process.env.SPICA_API_KEY || "";

  if (!baseUrl || !authKey) {
    throw new Error(
      "Spica URL and API key must be configured in MCP setup config. Please set SPICA_URL and SPICA_API_KEY environment variables in your setup."
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: authKey,
  };

  try {
    let response;
    switch (method.toLowerCase()) {
      case "get":
        response = await axios.get(url, { headers });
        break;
      case "post":
        response = await axios.post(url, data, { headers });
        break;
      case "put":
        response = await axios.put(url, data, { headers });
        break;
      case "delete":
        response = await axios.delete(url, { headers });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    return response;
  } catch (err: any) {
    throw new Error(
      err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message
    );
  }
}
