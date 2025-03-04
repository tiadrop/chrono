export type TimeUnit = "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "microfortnights";

export type TimeBreakdown<T extends TimeUnit> = Readonly<Record<T, number>>;
type PartialBreakdown<T extends TimeUnit = TimeUnit> = Partial<TimeBreakdown<T>>;

type TimePointDescription = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    timezone: string;
}

type TimePointEpochDescription = {
    unixEpoch: PartialBreakdown;
};

export class TimePoint {
    readonly unixEpoch: TimePeriod;

    /**
     * Create a TimePoint from a JavaScript Date
     * @param date
     */
    constructor(date: Date)
    /**
     * Create a TimePoint from a milliseconds elapsed since 1970-01-01
     * @param unixMs
     */
    constructor(unixMs: number)
    /**
     * Create a TimePoint from a period as elapsed since 1970-01-01
     * @param unixPeriod
     */
    constructor(unixPeriod: TimePeriod)
    /**
     * Create a TimePoint from a string
     *
     * This uses Date(string) to parse; be aware of its idiosyncrasies
     * @param dateString
     */
    constructor(dateString: string)
    /**
     * Create a TimePoint from an object description
     *
     * Description members should be as shown on a calendar and clock, ie `{ month: 2, day: 1 }` represents 1st February
     * @param description
     */
    constructor(description: TimePointDescription)
    constructor(description: TimePointEpochDescription)
    constructor(
        input: Date | number | string | TimePeriod | TimePointDescription | TimePointEpochDescription
    ) {
        if (typeof input == "string") input = new Date(input);
        if (input instanceof Date) input = input.getTime();
        if (typeof input == "number") input = new TimePeriod(input);
        if (!(input instanceof TimePeriod)) {
            if ("unixEpoch" in input) {
                input = new TimePeriod(input.unixEpoch);
            } else {
                const { year, month, day, hour, minute, second, timezone } = input;
                if ([year, month, day, hour, minute].some(v => v % 1 > 0)) {
                    throw new Error("Invalid time descriptor (non-integral values are only allowed for 'second')");
                }
                if (month < 1 || month > 12) throw new RangeError("Invalid month");
                let maxDay = new Date(year, month, 0).getDate();
                if (day < 1 || day > maxDay) throw new RangeError("Invalid day");
                if (hour < 0 || hour >= 24) throw new RangeError("Invalid hour");
                if (minute < 0 || minute >= 60) throw new RangeError("Invalid minute");
                if (second < 0 || second >= 60) throw new RangeError("Invalid second");
                const [
                    month0, day0, hour0, minute0, second0
                ] = [
                    month, day, hour, minute, second
                ].map(n => (n+'').padStart(2, '0'));
                input = new TimePoint(
                    `${year}-${month0}-${day0} ${hour0}:${minute0}:${second0} ${timezone}`
                ).unixEpoch;
            }
        }
        this.unixEpoch = input;
    }

    get asDate(){
        return new Date(this.unixEpoch.asMilliseconds);
    }

    isBefore(when: TimePoint | Date) {
        const ms = when instanceof Date ? when.getTime() : when.unixEpoch.asMilliseconds;
        return this.unixEpoch.asMilliseconds < ms;
    }

    isAfter(when: TimePoint | Date) {
        const ms = when instanceof Date ? when.getTime() : when.unixEpoch.asMilliseconds;
        return this.unixEpoch.asMilliseconds > ms;
    }

    /**
     * Creates a new `TimePoint` by adding one or more time periods to an existing one
     * @param periods
     * @returns the new `TimePoint`
     */
    add(...periods: (TimePeriod | PartialBreakdown)[]) {
        return new TimePoint(this.unixEpoch.add(...periods));
    }

    /**
     * Creates a new `TimePoint` subtracting a time period from an existing one
     * @param period
     * @returns the new `TimePoint`
     */
    subtract(period: TimePeriod | PartialBreakdown) {
        return new TimePoint(this.unixEpoch.subtract(period as any));
    }

    /**
     * Computes the difference between two time points.
     *
     * The result represents what would need to be added to this `TimePoint` in order to produce `time`, therefore if `time` represents the earlier time, the result will be a negative period.
     * @param time
     * @returns a `TimePeriod` representing the difference
     */
    difference(time: TimePoint | Date) {
        const timeMs = time instanceof Date
            ? time.getTime()
            : time.unixEpoch.asMilliseconds;
        return new TimePeriod(timeMs - this.unixEpoch.asMilliseconds);
    }

    equals(point: TimePoint | Date) {
        const pointMs = point instanceof Date
            ? point.getTime()
            : point.unixEpoch.asMilliseconds;
        return this.unixEpoch.asMilliseconds === pointMs;
    }

    /**
     * Compares a `TimePoint` with another
     * @param point
     * @returns 0 if the times are identical, -1 if this `TimePoint` occurs before `point`, 1 if this occurs after `point`
     */
    compare(point: TimePoint | Date) {
        const thisMs = this.unixEpoch.asMilliseconds;
        const pointMs = point instanceof Date
            ? point.getTime()
            : point.unixEpoch.asMilliseconds;
        if (thisMs === pointMs) return 0;
        return thisMs < pointMs ? -1 : 1;
    }

    toJSON() {
        return { unixEpoch: this.unixEpoch.breakdown() };
    }

    toString() {
        return this.asDate.toString();
    }

    static get epochStart() { return new TimePoint(0) }

    static now() {
        return new TimePoint(Date.now());
    }
}

const divisors: Record<TimeUnit, number> = {
    microfortnights: 1209.6,
    weeks: 3600000 * 24 * 7,
    days: 3600000 * 24,
    hours: 3600000,
    minutes: 60000,
    seconds: 1000,
    milliseconds: 1,
};

type BreakdownOptions<Z extends boolean> = {
    floatLast: boolean;
    includeZero: Z;
}

type DefaultBreakdownUnits = "days" | "hours" | "minutes" | "seconds" | "milliseconds";

export class TimePeriod {
    readonly asMilliseconds: number;

    constructor(milliseconds: number)
    constructor(breakdown: PartialBreakdown)
    constructor(t: number | PartialBreakdown) {
        if (typeof t == "number") {
            this.asMilliseconds = t;
            return;
        }
        this.asMilliseconds = Object.entries(t).reduce(
            (sum, [unit, amount]) => sum + divisors[unit as TimeUnit] * amount,
            0
        );
    }

    get asSeconds(){
        return this.asMilliseconds / divisors.seconds;
    }

    get asMinutes(){
        return this.asMilliseconds / divisors.minutes;
    }

    get asHours(){
        return this.asMilliseconds / divisors.hours;
    }

    get asDays(){
        return this.asMilliseconds / divisors.days;
    }

    get asWeeks(){
        return this.asMilliseconds / divisors.weeks;
    }

    /**
     * Creates a new `TimePeriod` by adding one or more periods to an existing one
     * @param periods
     * @returns the new `TimePeriod`
     */
    add(...periods: (TimePeriod | PartialBreakdown)[]): TimePeriod {
        return new TimePeriod({
            milliseconds: periods.reduce(
                (sum, p) => sum + (
                    p instanceof TimePeriod ? p : new TimePeriod(p)
                ).asMilliseconds,
                this.asMilliseconds
            ),
        });
    }

    subtract(period: TimePeriod): TimePeriod
    subtract(breakdown: PartialBreakdown): TimePeriod
    subtract(period: TimePeriod | PartialBreakdown): TimePeriod {
        if (!(period instanceof TimePeriod)) period = new TimePeriod(period);
        return new TimePeriod(this.asMilliseconds - period.asMilliseconds);
    }

    /**
     * Returns an object that describes this period in desired units
     *
     * eg `{ hours: 5, minutes: 30, seconds: 10 }`
     * @param units List of desired units as strings - eg `["hours", "minutes", "seconds"]`
     * @param options Defaults when units are provided: `{ floatLast: false, includeZero: true }`
     */
    breakdown<T extends TimeUnit, Z extends boolean = true>(
        units: T[],
        options?: Partial<BreakdownOptions<Z>>
    ): Z extends true
        ? TimeBreakdown<T>
        : PartialBreakdown<T>
    /**
     * Returns an object that describes this period using units days, hours, minutes, seconds and milliseconds
     *
     * eg `{ hours: 5, minutes: 30, seconds: 10 }`
     * @param options Defaults when units are not provided: `{ floatLast: true, includeZero: false }`
     */
    breakdown<Z extends boolean>(
        options?: Partial<BreakdownOptions<Z>>
    ): Z extends true
        ? TimeBreakdown<DefaultBreakdownUnits>
        : PartialBreakdown<DefaultBreakdownUnits>
    breakdown(
        units: TimeUnit[] | Partial<BreakdownOptions<boolean>> = {},
        options: Partial<BreakdownOptions<boolean>> = {}
    ) {
        let fullOptions: BreakdownOptions<boolean>;
        if (Array.isArray(units)) {
            // units provided
            fullOptions = {
                floatLast: false,
                includeZero: true,
                ...options,
            }
        } else {
            // units not provided; units is options
            fullOptions = {
                floatLast: true,
                includeZero: false,
                ...units,
            };
            units = ["days", "hours", "minutes", "seconds", "milliseconds"];
        }

        units = [...units].sort((a, b) => divisors[b] - divisors[a]);

        const {floatLast, includeZero} = fullOptions;
        let remaining = this.asMilliseconds;
        const result: Partial<Record<TimeUnit, number>> = {};
        const floatUnit = floatLast && units.at(-1);

        units.forEach(unit => {
            const div = divisors[unit];
            if (unit === floatUnit) {
                const amount = remaining / div;
                if (includeZero || amount !== 0) result[unit] = amount;
                return;
            }
            const amount = Math.floor(remaining / div);
            remaining -= amount * div;
            if (includeZero || amount !== 0) result[unit] = amount;
        });
        return result;
    }

    multiply(by: number) {
        return new TimePeriod({
            milliseconds: this.asMilliseconds * by,
        });
    }

    divide(by: number) {
        return new TimePeriod({
            milliseconds: this.asMilliseconds / by,
        });
    }

    equals(period: TimePeriod) {
        return period.asMilliseconds == this.asMilliseconds;
    }

    abs() {
        return this.asMilliseconds < 0
            ? new TimePeriod(Math.abs(this.asMilliseconds))
            : this;
    }

    toJSON() {
        return { milliseconds: this.asMilliseconds };
    }

    static weeks(n: number) { return new TimePeriod({weeks: n}) }
    static days(n: number) { return new TimePeriod({days: n}) }
    static hours(n: number) { return new TimePeriod({hours: n}) }
    static minutes(n: number) { return new TimePeriod({minutes: n}) }
    static seconds(n: number) { return new TimePeriod({seconds: n}) }
    static milliseconds(n: number) { return new TimePeriod(n) }

}

export function wait(period: TimePeriod): Promise<void>
export function wait(milliseconds: number): Promise<void>
export function wait(breakdown: PartialBreakdown): Promise<void>
export function wait(timePoint: TimePoint | Date): Promise<void>
export function wait(time: TimePeriod | number | PartialBreakdown | TimePoint | Date) {
    if (typeof time === "number") time = { milliseconds: time } ;
    return new Promise<void>(resolve => atTime(
        time instanceof TimePoint || time instanceof Date
            ? time
            : TimePoint.now().add(time),
        resolve
    ));
}

export function atTime(time: TimePoint | Date, func: () => void) {
    const diff = TimePoint.now().difference(time);
    if (diff.asSeconds < 30) return void setTimeout(func, diff.asMilliseconds);
    setTimeout(
        () => atTime(time, func),
        30000,
    );
}
