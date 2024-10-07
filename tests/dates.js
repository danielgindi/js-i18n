import { expect } from 'chai';
import i18n, { t } from '../src/i18n.js';

describe('dates', () => {

    it('format early years with padding', () => {
        let formatted = i18n.formatDate(new Date(202, 1, 3, 10, 11, 12), 'yyyy-MM-dd\'T\'HH:mm:ss');
        expect(formatted).to.equal('0202-02-03T10:11:12');
    });

});
