// backend/tests/admin.test.js
const admin = require("firebase-admin");
const mongoose = require("mongoose");
const {
  assignAdminRole,
  revokeAdminRole,
  getActivityFeed,
} = require("../controllers/adminController");
const { setRoles } = require("../controllers/roleController");

jest.mock("firebase-admin", () => {
  global.mockSetCustomUserClaims = global.mockSetCustomUserClaims || jest.fn();
  return {
    auth: () => ({
      setCustomUserClaims: global.mockSetCustomUserClaims,
    })
  };
});

jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../models/AuditLog", () => ({
  find: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  })),
  countDocuments: jest.fn().mockResolvedValue(0),
  create: jest.fn(),
}));

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("Admin Controller", () => {
  describe("setRoles", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should assign role if superadmin", async () => {
      const req = {
        body: { uid: "testuser1234", role: "moderator" },
        user: { uid: "superadmin123", role: "superadmin" },
        headers: { "user-agent": "Jest", "x-device-fingerprint": "fp123" },
        connection: { remoteAddress: "127.0.0.1" },
      };
      const res = mockRes();
      const userDoc = { uid: "testuser1234" };
      User.findOne.mockResolvedValue(userDoc);
      admin.auth().setCustomUserClaims.mockResolvedValue();
      User.findOneAndUpdate.mockResolvedValue();
      AuditLog.create.mockResolvedValue();
      await setRoles(req, res);
      expect(global.mockSetCustomUserClaims).toHaveBeenCalledWith("testuser1234", expect.objectContaining({ moderator: true }));
      expect(User.findOneAndUpdate).toHaveBeenCalledWith({ uid: "testuser1234" }, { $set: { role: "moderator" } });
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: "set-role", actor: "superadmin123", target: "testuser1234" }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it("should forbid if not superadmin", async () => {
      const req = { body: { uid: "testuser1234", role: "admin" }, user: { uid: "user1", role: "admin" } };
      const res = mockRes();
      await setRoles(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it("should fail with invalid UID", async () => {
      const req = { body: { uid: "x", role: "admin" }, user: { uid: "superadmin123", role: "superadmin" } };
      const res = mockRes();
      await setRoles(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should fail with invalid role", async () => {
      const req = { body: { uid: "testuser1234", role: "banana" }, user: { uid: "superadmin123", role: "superadmin" } };
      const res = mockRes();
      await setRoles(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should fail if user not found", async () => {
      const req = { body: { uid: "missinguser1234", role: "admin" }, user: { uid: "superadmin123", role: "superadmin" } };
      const res = mockRes();
      User.findOne.mockResolvedValue(null);
      await setRoles(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it("should handle internal error", async () => {
      const req = { body: { uid: "testuser1234", role: "admin" }, user: { uid: "superadmin123", role: "superadmin" } };
      const res = mockRes();
      User.findOne.mockImplementation(() => { throw new Error("DB error"); });
      await setRoles(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockSetCustomUserClaims.mockClear();
  });

  describe("assignAdminRole", () => {
    it("should assign admin role successfully", async () => {
      const req = {
        body: { uid: "abc1234567890" },
        user: { uid: "superadmin123", superadmin: true },
        ip: "127.0.0.1",
        headers: { "user-agent": "Jest" },
      };
      const res = mockRes();

      User.findOne.mockResolvedValue({ uid: "abc1234567890" });
      admin.auth().setCustomUserClaims.mockResolvedValue();
      User.findOneAndUpdate.mockResolvedValue();

      await assignAdminRole(req, res);

      expect(global.mockSetCustomUserClaims).toHaveBeenCalledWith(
        "abc1234567890",
        { admin: true }
      );
      expect(User.findOneAndUpdate).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should fail if not superadmin", async () => {
      const req = {
        body: { uid: "abc1234567890" },
        user: { uid: "normaluser" },
      };
      const res = mockRes();

      await assignAdminRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("revokeAdminRole", () => {
    it("should revoke admin role successfully", async () => {
      const req = {
        body: { uid: "adminUser123" },
        user: { uid: "superadmin123", superadmin: true },
        ip: "127.0.0.1",
        headers: { "user-agent": "Jest" },
      };
      const res = mockRes();

      User.findOne.mockResolvedValue({ uid: "adminUser123" });
      admin.auth().setCustomUserClaims.mockResolvedValue();
      User.findOneAndUpdate.mockResolvedValue();

      await revokeAdminRole(req, res);

      expect(global.mockSetCustomUserClaims).toHaveBeenCalledWith(
        "adminUser123",
        { admin: false }
      );
      expect(User.findOneAndUpdate).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should fail with invalid UID", async () => {
      const req = { body: { uid: "x" }, user: { superadmin: true } };
      const res = mockRes();

      await revokeAdminRole(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getActivityFeed", () => {
    it("should return audit logs with pagination", async () => {
      const req = { query: { page: "1", limit: "10" } };
      const res = mockRes();

      AuditLog.find.mockReturnValueOnce({
        sort: () => ({
          skip: () => ({
            limit: jest.fn().mockResolvedValue([{ action: "assign-admin" }]),
          }),
        }),
      });
      AuditLog.countDocuments.mockResolvedValue(1);

      await getActivityFeed(req, res);

      expect(res.json).toHaveBeenCalledWith({
        logs: [{ action: "assign-admin" }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
    });
  });
});
