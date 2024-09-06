import { atTime, TimePeriod, TimePoint, wait } from "../index"


describe("wait()", () => {
    it("should resolve after a given period", async () => {
        let startTime = Date.now();
        await wait(TimePeriod.milliseconds(200));
        let elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThan(199);
        expect(elapsed).toBeLessThan(210);
    });
    it("should resolve at a given time", async () => {
        let startTime = Date.now();
        await wait(TimePoint.now().add({milliseconds: 150}));
        let elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThan(149);
        expect(elapsed).toBeLessThan(160);
    });
});

describe("atTime()", () => {
    it("should run the callback at the given time", async () => {
        const checkFn = jest.fn();
        atTime(TimePoint.now().add({milliseconds: 200}), checkFn);
        await wait(195);
        expect(checkFn).not.toHaveBeenCalled();
        await wait(10);
        expect(checkFn).toHaveBeenCalled();
    });
});
