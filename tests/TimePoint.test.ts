import {TimeBreakdown, TimePeriod, TimePoint, TimeUnit} from "../index"


describe("TimePoint", () => {
    const specialTime = new TimePoint("2020-10-31 19:30 GMT");

    describe("construction", () => {
        const baseDescriptor = {
            year: 2020,
            month: 10,
            day: 31,
            hour: 19,
            minute: 30,
            second: 0,
            timezone: "GMT"
        };

        it("should instantiate given a Date", () => {
            const now = new Date();
            const tp = new TimePoint(now);
            expect(tp.unixEpoch.asMilliseconds ).toBe(now.getTime());
        });

        it("should instantiate given a string", () => {
            const s = "1992-11-24 13:37 GMT";
            const point = new TimePoint(s);
            const date = new Date(s);
            expect(point.unixEpoch.asMilliseconds).toBe(date.getTime());
        });

        it("should instantiate given an epochal TimePeriod", () => {
            const point = new TimePoint(new TimePeriod({
                seconds: 1635706800
            }));
            expect(point.unixEpoch.asMilliseconds).toBe(1635706800000);
        });

        it("should instantiate given a number of milliseconds", () => {
            const ms = 133742069;
            const point = new TimePoint(ms);
            expect(point.unixEpoch.asMilliseconds).toBe(ms);
        });

        it("should instantiate given a descriptor object", () => {
            const point = new TimePoint(baseDescriptor);
            expect(point.unixEpoch.breakdown()).toStrictEqual(specialTime.unixEpoch.breakdown());
        });

        it("should disallow invalid descriptors", () => {
            expect(() => new TimePoint({...baseDescriptor, year: 2021.4})).toThrow();
            expect(() => new TimePoint({...baseDescriptor, month: 0})).toThrow();
            expect(() => new TimePoint({...baseDescriptor, second: -10})).toThrow();
            expect(() => new TimePoint({...baseDescriptor, month: 2, day: 30})).toThrow();
            expect(() => new TimePoint({...baseDescriptor, hour: 24})).toThrow();
            expect(() => new TimePoint({...baseDescriptor, minute: 60})).toThrow();
        });
        
    });

    it("should provide an accurate JS Date", () => {
        const s = "1992-11-24 13:37 GMT";
        const point = new TimePoint(s);
        const date = point.asDate;
        expect(point.unixEpoch.asMilliseconds).toBe(date.getTime());
    });

    it("should add (mixture of) TimePeriod and TimeBreakdown", () => {
        const weekAfterSpecial = specialTime.add(
            TimePeriod.days(3),
            { days: 4 }
        );
        expect(weekAfterSpecial.unixEpoch.asMilliseconds).toBe(
            new Date("2020-11-07 19:30 GMT").getTime()
        );
    });

    it("should subtract TimePeriod and TimeBreakdown", () => {
        const weekBeforeSpecialTP = specialTime.subtract(TimePeriod.days(7));
        expect(weekBeforeSpecialTP.unixEpoch.asMilliseconds).toBe(
            new Date("2020-10-24 19:30 GMT").getTime()
        );
        const weekBeforeSpecialBD = specialTime.subtract({weeks: 1});
        expect(weekBeforeSpecialBD.unixEpoch.asMilliseconds).toBe(
            new Date("2020-10-24 19:30 GMT").getTime()
        );
    });

    it("should encode to JSON as { unixEpoch: TimeBreakdown }", () => {
        const json = JSON.stringify(specialTime);
        const parsed = new TimePeriod(JSON.parse(json).unixEpoch);
        expect(specialTime.unixEpoch.asMilliseconds).toBeCloseTo(parsed.asMilliseconds);
    });

    it("should check if a TimePoint comes before / after a given TimePoint or Date", () => {
        const s = "2016-10-31 GMT";
        const point = new TimePoint(s);
        const date = new Date(s);
        expect(point.isBefore(specialTime)).toBeTruthy();
        expect(point.isAfter(specialTime)).toBeFalsy();
        expect(specialTime.isBefore(date)).toBeFalsy();
        expect(specialTime.isAfter(date)).toBeTruthy();
    });

    it("should provide difference between two TimePoints as a TimePeriod", () => {
        const point = specialTime.add({
            days: 1,
            hours: 1,
        });
        const diff = specialTime.difference(point);
        expect(diff.breakdown(["days", "minutes"])).toStrictEqual({
            days: 1,
            minutes: 60,
        });
    });

    it("should check equality", () => {
        const point = new TimePoint(specialTime.unixEpoch.asMilliseconds);
        expect(specialTime.equals(point)).toBeTruthy();
        expect(specialTime.equals(TimePoint.now())).toBeFalsy();
    })

    it("should provide correct now()", () => {
        const dateNow = Date.now();
        const tpNow = TimePoint.now();
        const diff = Math.abs(tpNow.unixEpoch.asMilliseconds - dateNow);
        expect(diff).toBeLessThan(50);
    });

    it("should instantiate from a unixEpoch breakdown", () => {
        const now = new Date();
        const point = new TimePoint(now);
        const point2 = new TimePoint({
            unixEpoch: point.unixEpoch.breakdown(),
        });
        expect(point.equals(point2)).toBeTruthy();
        const json = JSON.stringify({
            time: point,
        });
        const parsed = JSON.parse(json);
        const point3 = new TimePoint(parsed.time);
        expect(point3.unixEpoch.asMilliseconds).toBe(point.unixEpoch.asMilliseconds);
    });

});