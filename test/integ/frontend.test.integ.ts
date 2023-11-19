import axios from "axios";
console.log("CloudFront URL:", process.env.VITE_FRONTEND_URL);
describe("CloudFront Endpoint", () => {
  it("should return a 200 response", async () => {
    const CLOUDFRONT_URL = process.env.VITE_FRONTEND_URL!;
    const response = await axios.get(`https://${CLOUDFRONT_URL}`, {});
    expect(response.status).toBe(200);
  });
});
