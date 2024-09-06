import { TimePeriod } from "../index"

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

        it("should always break into most significant units first, regardless of array order", () => {
            expect(period.breakdown(["minutes", "days"])).toStrictEqual({
                days: 0,
                minutes: 90
            });
        })

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
        expect(hourAndHalf.divide(2).asMilliseconds).toBe(hourAndHalf.asMilliseconds / 2);
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
        expect(new TimePeriod({
            weeks: 1,
            days: 6,
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 1000,
        }).equals(TimePeriod.weeks(2))).toBeTruthy();
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
