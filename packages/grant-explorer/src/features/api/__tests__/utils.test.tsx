import {
  pinToIPFS,
  dateFromMs,
  getDaysLeft,
  getRoundStates,
} from "../utils";

describe("pinToIPFS", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should pin JSON data to IPFS", async () => {
    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        IpfsHash: cid,
        PinSize: 1024,
        TimeStamp: new Date().toISOString(),
      })
    );

    const ipfsObject = {
      content: {
        name: "My First Round",
      },
      metadata: {
        name: "round-metadata",
      },
    };

    const res = await pinToIPFS(ipfsObject);

    const params = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataMetadata: ipfsObject.metadata,
        pinataOptions: {
          cidVersion: 1,
        },
        pinataContent: ipfsObject.content,
      }),
    };

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      params
    );
    expect(res.IpfsHash).toEqual(cid);
  });

  it("should pin blob data to IPFS", async () => {
    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        IpfsHash: cid,
        PinSize: 1024,
        TimeStamp: new Date().toISOString(),
      })
    );

    const ipfsObject = {
      content: new Blob([]),
      metadata: {
        name: "round-metadata",
      },
    };

    const res = await pinToIPFS(ipfsObject);

    const fd = new FormData();
    fd.append("file", ipfsObject.content as Blob);
    fd.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 1,
      })
    );
    fd.append("pinataMetadata", JSON.stringify(ipfsObject.metadata));

    const params = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
      },
      body: fd,
    };

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      params
    );
    expect(res.IpfsHash).toEqual(cid);
  });

  it("should reject upon failure to pin blob data", async () => {
    fetchMock.mockResponseOnce("", {
      status: 403,
    }); /*Common error-expired API credentials*/

    const ipfsObject = {
      content: new Blob([]),
      metadata: {
        name: "round-metadata",
      },
    };

    await expect(pinToIPFS(ipfsObject)).rejects.toHaveProperty("status", 403);

    const fd = new FormData();
    fd.append("file", ipfsObject.content);
    fd.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 1,
      })
    );
    fd.append("pinataMetadata", JSON.stringify(ipfsObject.metadata));

    const params = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
      },
      body: fd,
    };

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      params
    );
  });

  it("should reject upon failure to pin json data", async () => {
    fetchMock.mockResponseOnce("", {
      status: 403,
    }); /*Common error-expired API credentials*/

    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        IpfsHash: cid,
        PinSize: 1024,
        TimeStamp: new Date().toISOString(),
      })
    );

    const ipfsObject = {
      content: {
        name: "My First Round",
      },
      metadata: {
        name: "round-metadata",
      },
    };

    await expect(pinToIPFS(ipfsObject)).rejects.toHaveProperty("status", 403);

    const params = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataMetadata: ipfsObject.metadata,
        pinataOptions: {
          cidVersion: 1,
        },
        pinataContent: ipfsObject.content,
      }),
    };

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      params
    );
  });

  it("should create a formatted date string with milliseconds or seconds", () => {
    expect(dateFromMs(1627622400000)).toEqual("Jul 30, 2021");
    expect(dateFromMs(1627622400)).toEqual("Jul 30, 2021");
  });
});

describe("getRoundStates", () => {
  test("when round is ended, report `ended`", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-13").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-19").getTime(),
      })
    ).toEqual(["ended"]);
  });

  test("before application start, report `accepting-applications`", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-13").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-12").getTime(),
      })
    ).toEqual(["accepting-applications"]);
  });

  test("when application time overlaps with round time, report both `accepting-applications` and `active`", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-10").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-14").getTime(),
      })
    ).toEqual(["active", "accepting-applications"]);
  });

  test("between round start and round end, report `active`", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-13").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-16").getTime(),
      })
    ).toEqual(["active"]);
  });

  test("when application end time is invalid and round end time is in the past, report `ended`", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr: undefined,
        atTimeMs: new Date("2023-12-20").getTime(),
      })
    ).toEqual(["ended"]);

    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr:
          "1000000000000000000000000000000000000000000",
        atTimeMs: new Date("2023-12-20").getTime(),
      })
    ).toEqual(["ended"]);
  });

  test("when round end time is invalid and application end time is in the future, report `accepting-applications`", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: undefined,
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-13").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-12").getTime(),
      })
    ).toEqual(["accepting-applications"]);

    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr:
          "10000000000000000000000000000000000000000000000",
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-13").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-12").getTime(),
      })
    ).toEqual(["accepting-applications"]);
  });

  test("between applications end and round start, report undefined", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: String(
          new Date("2023-12-15").getTime() / 1000
        ),
        roundEndTimeInSecsStr: String(new Date("2023-12-18").getTime() / 1000),
        applicationsEndTimeInSecsStr: String(
          new Date("2023-12-13").getTime() / 1000
        ),
        atTimeMs: new Date("2023-12-14").getTime(),
      })
    ).toEqual(undefined);
  });

  test("when round end time and applications end time are invalid, report undefined", () => {
    expect(
      getRoundStates({
        roundStartTimeInSecsStr: undefined,
        roundEndTimeInSecsStr: undefined,
        applicationsEndTimeInSecsStr: undefined,
        atTimeMs: new Date("2023-12-12").getTime(),
      })
    ).toEqual(undefined);
  });
});

describe("getDaysLeft", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("return number of days between now and a target timestamp", () => {
    vi.setSystemTime(new Date("2023-12-13").getTime());
    expect(
      getDaysLeft(String(new Date("2023-12-15").getTime() / 1000))
    ).toEqual(2);
  });

  test("return negative number if date is in the past", () => {
    vi.setSystemTime(new Date("2023-12-13").getTime());
    expect(
      getDaysLeft(String(new Date("2023-12-11").getTime() / 1000))
    ).toEqual(-2);
  });
});
