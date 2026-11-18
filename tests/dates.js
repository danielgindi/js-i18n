import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import i18n from '../src/i18n.ts';

const timezoneRunner = fileURLToPath(new URL('./helpers/parse_date_timezone.mjs', import.meta.url));

const timezoneCases = [
    {
        zone: 'America/New_York',
        cases: [
            ['spring Z before', '2024-03-10T06:59:59Z', '2024-03-10T06:59:59.000Z'],
            ['spring Z after', '2024-03-10T07:00:00Z', '2024-03-10T07:00:00.000Z'],
            ['spring offset before', '2024-03-10T01:59:59-05:00', '2024-03-10T06:59:59.000Z'],
            ['spring offset after', '2024-03-10T03:00:00-04:00', '2024-03-10T07:00:00.000Z'],
            ['spring local before', '2024-03-10T01:59:59', '2024-03-10T06:59:59.000Z'],
            ['spring skipped local hour', '2024-03-10T02:30:00', '2024-03-10T07:30:00.000Z'],
            ['spring local after', '2024-03-10T03:00:00', '2024-03-10T07:00:00.000Z'],
            ['fall Z before', '2024-11-03T05:59:59Z', '2024-11-03T05:59:59.000Z'],
            ['fall Z after', '2024-11-03T06:00:00Z', '2024-11-03T06:00:00.000Z'],
            ['fall first 01:59 with offset', '2024-11-03T01:59:59-04:00', '2024-11-03T05:59:59.000Z'],
            ['fall second 01:00 with offset', '2024-11-03T01:00:00-05:00', '2024-11-03T06:00:00.000Z'],
            ['fall local before', '2024-11-03T00:59:59', '2024-11-03T04:59:59.000Z'],
            ['fall repeated local hour', '2024-11-03T01:30:00', '2024-11-03T05:30:00.000Z'],
            ['fall local after', '2024-11-03T02:00:00', '2024-11-03T07:00:00.000Z'],
        ],
    },
    {
        zone: 'Europe/Berlin',
        cases: [
            ['spring Z before', '2024-03-31T00:59:59Z', '2024-03-31T00:59:59.000Z'],
            ['spring Z after', '2024-03-31T01:00:00Z', '2024-03-31T01:00:00.000Z'],
            ['spring offset before', '2024-03-31T01:59:59+01:00', '2024-03-31T00:59:59.000Z'],
            ['spring offset after', '2024-03-31T03:00:00+02:00', '2024-03-31T01:00:00.000Z'],
            ['spring local before', '2024-03-31T01:59:59', '2024-03-31T00:59:59.000Z'],
            ['spring skipped local hour', '2024-03-31T02:30:00', '2024-03-31T01:30:00.000Z'],
            ['spring local after', '2024-03-31T03:00:00', '2024-03-31T01:00:00.000Z'],
            ['fall Z before', '2024-10-27T00:59:59Z', '2024-10-27T00:59:59.000Z'],
            ['fall Z after', '2024-10-27T01:00:00Z', '2024-10-27T01:00:00.000Z'],
            ['fall first 02:59 with offset', '2024-10-27T02:59:59+02:00', '2024-10-27T00:59:59.000Z'],
            ['fall second 02:00 with offset', '2024-10-27T02:00:00+01:00', '2024-10-27T01:00:00.000Z'],
            ['fall local before', '2024-10-27T01:59:59', '2024-10-26T23:59:59.000Z'],
            ['fall repeated local hour', '2024-10-27T02:30:00', '2024-10-27T00:30:00.000Z'],
            ['fall local after', '2024-10-27T03:00:00', '2024-10-27T02:00:00.000Z'],
        ],
    },
    {
        zone: 'Australia/Sydney',
        cases: [
            ['spring Z before', '2024-10-05T15:59:59Z', '2024-10-05T15:59:59.000Z'],
            ['spring Z after', '2024-10-05T16:00:00Z', '2024-10-05T16:00:00.000Z'],
            ['spring offset before', '2024-10-06T01:59:59+10:00', '2024-10-05T15:59:59.000Z'],
            ['spring offset after', '2024-10-06T03:00:00+11:00', '2024-10-05T16:00:00.000Z'],
            ['spring local before', '2024-10-06T01:59:59', '2024-10-05T15:59:59.000Z'],
            ['spring skipped local hour', '2024-10-06T02:30:00', '2024-10-05T16:30:00.000Z'],
            ['spring local after', '2024-10-06T03:00:00', '2024-10-05T16:00:00.000Z'],
            ['fall Z before', '2024-04-06T15:59:59Z', '2024-04-06T15:59:59.000Z'],
            ['fall Z after', '2024-04-06T16:00:00Z', '2024-04-06T16:00:00.000Z'],
            ['fall first 02:59 with offset', '2024-04-07T02:59:59+11:00', '2024-04-06T15:59:59.000Z'],
            ['fall second 02:00 with offset', '2024-04-07T02:00:00+10:00', '2024-04-06T16:00:00.000Z'],
            ['fall local before', '2024-04-07T01:59:59', '2024-04-06T14:59:59.000Z'],
            ['fall repeated local hour', '2024-04-07T02:30:00', '2024-04-06T15:30:00.000Z'],
            ['fall local after', '2024-04-07T03:00:00', '2024-04-06T17:00:00.000Z'],
        ],
    },
    {
        zone: 'Asia/Kathmandu',
        cases: [
            ['Z with a fractional local offset', '2024-03-10T00:00:00Z', '2024-03-10T00:00:00.000Z'],
            ['explicit fractional offset', '2024-03-10T05:45:00+05:45', '2024-03-10T00:00:00.000Z'],
            ['local time with a fractional offset', '2024-03-10T05:45:00', '2024-03-10T00:00:00.000Z'],
        ],
    },
];

describe('dates', () => {
    it('formats early years with padding', () => {
        const formatted = i18n.formatDate(new Date(202, 1, 3, 10, 11, 12), 'yyyy-MM-dd\'T\'HH:mm:ss');
        expect(formatted).to.equal('0202-02-03T10:11:12');
    });

    describe('parseDate across timezones', () => {
        for (const { zone, cases } of timezoneCases) {
            describe(zone, () => {
                let actualDates;

                before(() => {
                    const child = spawnSync(process.execPath, [timezoneRunner], {
                        cwd: fileURLToPath(new URL('..', import.meta.url)),
                        env: { ...process.env, TZ: zone },
                        input: JSON.stringify(cases.map(([, input]) => input)),
                        encoding: 'utf8',
                    });

                    expect(child.error, child.stderr).to.equal(undefined);
                    expect(child.status, child.stderr).to.equal(0);
                    actualDates = JSON.parse(child.stdout);
                });

                for (const [index, [name, input, expected]] of cases.entries()) {
                    it(name, () => {
                        expect(actualDates[index], `${zone}: ${input}`).to.equal(expected);
                    });
                }
            });
        }
    });
});
