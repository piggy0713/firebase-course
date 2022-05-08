const assert = require("assert");
const firebase = require("@firebase/testing");

const MY_PROJECT_ID = "fir-codebusters-7ad88";
const myId = "user_123";
const anotherId = "user_456";
const myAuth = { uid: myId, email: "test@gmail.com" };

function getFirestore(auth) {
  return firebase
    .initializeTestApp({ projectId: MY_PROJECT_ID, auth })
    .firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({ projectId: MY_PROJECT_ID }).firestore();
}

// Clear firestore before each test
beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId: MY_PROJECT_ID });
});

describe("Todo App", () => {
  it("Understands basic addition", () => {
    assert.equal(2 + 2, 4);
  });

  // Test firestore rules
  it("should allow a user to update their own todos", async () => {
    const admin = getAdminFirestore();
    await admin
      .collection("todos")
      .doc("Todo1")
      .set({ name: "before", uid: myId });
    const db = getFirestore(myAuth);

    const testDoc = db.collection("todos").doc("Todo1");
    await firebase.assertSucceeds(testDoc.update({ name: "after" }));
  });

  it("should allow a user to read their own todos", async () => {
    const admin = getAdminFirestore();
    await admin
      .collection("todos")
      .doc("Todo2")
      .set({ name: "read my todo", uid: myId });
    const db = getFirestore(myAuth);

    const testDoc = db.collection("todos").doc("Todo2");
    await firebase.assertSucceeds(testDoc.get());
  });

  it("should not allow a user to edit other's todos", async () => {
    const admin = getAdminFirestore();
    await admin
      .collection("todos")
      .doc("Todo3")
      .set({ name: "read my todo", uid: anotherId });
    const db = getFirestore(myAuth);

    const testDoc = db.collection("todos").doc("Todo3");
    await firebase.assertFails(testDoc.update({ name: "edit other's todo" }));
  });

  it("should allow a user to read other's profile", async () => {
    const admin = getAdminFirestore();
    await admin
      .collection("users")
      .doc("user1")
      .set({ displayName: "test user 1", uid: myId, isAdmin: false });
    await admin
      .collection("users")
      .doc("user2")
      .set({ displayName: "test user 2", uid: anotherId, isAdmin: false });
    const db = getFirestore(myAuth);

    const testUser = db.collection("todos").doc("user2");
    await firebase.assertFails(testUser.get());
  });

  it("should allow a user to update their own user profile", async () => {
    const admin = getAdminFirestore();
    await admin
      .collection("users")
      .doc("user3")
      .set({ displayName: "old name", uid: myId, isAdmin: false });
    const db = getFirestore(myAuth);

    const testDoc = db.collection("users").doc("user3");
    await firebase.assertSucceeds(testDoc.update({ displayName: "new name" }));
  });

  it("should not allow any user to change admin status", async () => {
    const admin = getAdminFirestore();
    await admin
      .collection("users")
      .doc("user4")
      .set({ displayName: "test user 4", uid: myId, isAdmin: true });
    const db = getFirestore(myAuth);

    const testUser = db.collection("users").doc("user4");
    await firebase.assertFails(testUser.update({ isAdmin: false }));
  });
});
