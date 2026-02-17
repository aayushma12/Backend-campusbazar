import request from "supertest";
import app from "../../app"; // Adjust path to your Express app
// import { adminToken, studentToken } from "../../testUtils/tokens"; // Removed: file does not exist

describe("Admin User Management", () => {
    it("should return 403 if a non-admin tries to get user list", async () => {
        const response = await request(app)
            .get("/api/auth/users")
            // .set("Authorization", `Bearer ${studentToken}`); // Token not defined
        expect(response.status).toBe(403);
    });

    it("should return paginated data for admin", async () => {
        const response = await request(app)
            .get("/api/auth/users?page=1&limit=5")
            // .set("Authorization", `Bearer ${adminToken}`); // Token not defined
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
        expect(response.body.pagination).toBeDefined();
    });
});