import {TimeBreakdown, TimePeriod, TimePoint, TimeUnit} from "../index"

const hourAndHalf = TimePeriod.hours(1.5);

describe("TimePeriod", () => {

    it("should provide correct weeks, days, hours, minutes, seconds and milliseconds", () => {
        expect(hourAndHalf.asDays).toBe(1.5 / 24);
        expect(hourAndHalf.asHours).toBe(1.5);
        expect(hourAndHalf.asMinutes).toBe(90);
        expect(hourAndHalf.asSeconds).toBe(90 * 60);
        expect(hourAndHalf.asMilliseconds).toBe(90 * 60000);
        expect(new TimePeriod({days: 14}).asWeeks).toBe(2);
    });

    describe("construction", () => {
        it("should instantiate given a breakdown", () => {
            expect(new TimePeriod({
                hours: 1,
                minutes: 30
            }).asMinutes).toBe(90);
            expect(new TimePeriod({
                hours: 1.75,
            }).asMinutes).toBe(105);
        });
        
        it("should instantiate given a number of milliseconds", () => {
            const fromMs = new TimePeriod(1337);
            expect(fromMs.asMilliseconds).toBe(1337);
        });
    });


    describe("breakdown()", () => {
        const period = new TimePeriod({hours: 1, minutes: 30, seconds: 15});

        it("should provide automatic breakdown if no unit list is provided", () => {
            expect(period.breakdown()).toStrictEqual({
                hours: 1,
                minutes: 30,
                seconds: 15,
            });
            expect(period.add({milliseconds: 500}).breakdown()).toStrictEqual({
                hours: 1,
                minutes: 30,
                seconds: 15,
                milliseconds: 500,
            });
        });


        it("should include zeros if includeZero option is true", () => {
            expect(period.breakdown({
                includeZero: true,
            })).toStrictEqual({
                hours: 1,
                minutes: 30,
                seconds: 15,
                days: 0,
                milliseconds: 0,
            });
            expect(period.breakdown(["days", "minutes"])).toStrictEqual({
                days: 0,
                minutes: 90
            });
        })

        it("should provide accurate breakdown given a list of units", () => {
            expect(period.breakdown(["hours"])).toStrictEqual({hours: 1});
            expect(period.breakdown(["hours", "minutes"])).toStrictEqual({hours: 1, minutes: 30});
            expect(period.breakdown(["days", "hours", "minutes"])).toStrictEqual({days: 0, hours: 1, minutes: 30});
        });

        it("should provide full float value of last unit when floatLast option is true", () => {
            expect(period.breakdown(["hours", "minutes"], {
                floatLast: true
            })).toStrictEqual({
                hours: 1,
                minutes: 30.25,
            });
            expect(TimePeriod.seconds(65.3).breakdown(["minutes", "seconds"], {
                floatLast: true
            })).toStrictEqual({
                minutes: 1,
                seconds: 5.3,
            });
        });

    });

    describe("add()", () => {
        it("should add TimePeriod", () => {
            const period = hourAndHalf.add(TimePeriod.seconds(125));
            expect(period.breakdown(["hours", "minutes", "seconds"])).toStrictEqual({
                hours: 1,
                minutes: 32,
                seconds: 5
            });
        });

        it("should add TimeBreakdown", () => {
            const period = hourAndHalf.add({seconds: 125});
            expect(period.breakdown(["hours", "minutes", "seconds"])).toStrictEqual({
                hours: 1,
                minutes: 32,
                seconds: 5
            });
        });
    });

    describe("subtract()", () => {
        it("should subtract TimePeriod", () => {
            const period = hourAndHalf.subtract(TimePeriod.seconds(125));
            expect(period.breakdown(["hours", "minutes", "seconds"])).toStrictEqual({
                hours: 1,
                minutes: 27,
                seconds: 55
            });
        });

        it("should subtract TimeBreakdown", () => {
            const period = hourAndHalf.subtract({seconds: 125});
            expect(period.breakdown(["hours", "minutes", "seconds"])).toStrictEqual({
                hours: 1,
                minutes: 27,
                seconds: 55
            });
        });
    });

    it("should multiply", () => {
        expect(hourAndHalf.multiply(3).asMilliseconds).toBe(hourAndHalf.asMilliseconds * 3);
    });

    it("should divide", () => {
        expect(hourAndHalf.divide(3).asMilliseconds).toBe(hourAndHalf.asMilliseconds / 3);
    });

    it("should check equality", () => {
        expect(new TimePeriod({
            hours: 1,
            minutes: 30
        }).equals(hourAndHalf)).toBeTruthy();
        expect(new TimePeriod({
            hours: 1,
            minutes: 30,
            milliseconds: 1,
        }).equals(hourAndHalf)).toBeFalsy();
    });

    it("should encode to JSON as { milliseconds }", () => {
        const json = JSON.stringify(hourAndHalf);
        expect(json).toBe(JSON.stringify({
            milliseconds: hourAndHalf.asMilliseconds
        }));
    });

    it("should provide correct periods via static methods", () => {
        expect(TimePeriod.weeks(2).asMilliseconds).toBe(24 * 7 * 3600000 * 2);
        expect(TimePeriod.days(2).asMilliseconds).toBe(24 * 3600000 * 2);
        expect(TimePeriod.minutes(2).asSeconds).toBe(120);
        expect(TimePeriod.milliseconds(1500).asSeconds).toBeCloseTo(1.5);
    });

});

describe("TimePoint", () => {
    const specialTime = new TimePoint("2021-10-31 19:30 GMT");

    describe("construction", () => {
        const baseDescriptor = {
            year: 2021,
            month: 10,
            day: 31,
            hour: 19,
            minute: 30,
            second: 0,
            timezone: "GMT"
        }

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
            new Date("2021-11-07 19:30 GMT").getTime()
        );
    });

    it("should subtract TimePeriod and TimeBreakdown", () => {
        const weekBeforeSpecialTP = specialTime.subtract(TimePeriod.days(7));
        expect(weekBeforeSpecialTP.unixEpoch.asMilliseconds).toBe(
            new Date("2021-10-24 19:30 GMT").getTime()
        );
        const weekBeforeSpecialBD = specialTime.subtract({weeks: 1});
        expect(weekBeforeSpecialBD.unixEpoch.asMilliseconds).toBe(
            new Date("2021-10-24 19:30 GMT").getTime()
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

});