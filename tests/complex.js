import { expect } from 'chai';
import i18n, { t } from '../src/i18n';

describe('complex', () => {

    beforeEach(() => {
        i18n.reset();
    })

    it('respects pointer in complex value', () => {
        i18n.add('en', { 'foo': 'bar', 'complex': 'foo {foo} end' });
        expect(t('complex')).to.equal('foo bar end');
    });

    it('respects param in complex value', () => {
        i18n.add('en', { 'foo': 'one', 'complex': 'foo {{foo}} end' });
        expect(t('complex', { 'foo': 'two' })).to.equal('foo two end');
    });

    it('applies `html` filter', () => {
        i18n.add('en', { 'complex': 'foo {{param|html}} end' });
        expect(t('complex', { 'param': 'unsafe "value" for html\nno newlines' }))
            .to.equal('foo unsafe &quot;value&quot; for html\nno newlines end');
    });

    it('applies `htmll` filter', () => {
        i18n.add('en', { 'complex': 'foo {{param|htmll}} end' });
        expect(t('complex', { 'param': 'unsafe "value" for html with\nnewline' }))
            .to.equal('foo unsafe &quot;value&quot; for html with<br />newline end');
    });

    it('applies `json` filter', () => {
        i18n.add('en', { 'complex': 'foo {{param|json}} end' });
        expect(t('complex', { 'param': { 'foo': 'bar' } }))
            .to.equal('foo {"foo":"bar"} end');
    });

    it('applies `url` filter', () => {
        i18n.add('en', { 'complex': 'foo https://www.google.com/?q={{q|url}} end' });
        expect(t('complex', { 'q': 'hey jude' }))
            .to.equal('foo https://www.google.com/?q=hey%20jude end');
    });

    it('applies `lower` filter', () => {
        i18n.add('en', { 'foo': 'BAR', 'complex': 'foo {foo|lower} end' });
        expect(t('complex')).to.equal('foo bar end');
    });

    it('applies `upper` filter', () => {
        i18n.add('en', { 'foo': 'bar', 'complex': 'foo {foo|upper} end' });
        expect(t('complex')).to.equal('foo BAR end');
    });

    it('applies `upperfirst` filter', () => {
        i18n.add('en', { 'foo': 'bar', 'complex': 'foo {foo|upperfirst} end' });
        expect(t('complex')).to.equal('foo Bar end');

        i18n.extendLanguage('en', { 'foo': 'BAR' });
        expect(t('complex')).to.equal('foo Bar end');
    });

    it('applies `printf` filter', () => {
        i18n.add('en', {
            'f1': '{{num|printf 10.5f}}',
            'f2': '{{num|printf 010.5f}}',
            'f3': '{{num|printf 010.f}}',
            'f4': '{{num|printf 08f}}',
            'f5': '{{num|printf .5f}}',
            'f6': '{{num|printf #f}}',
            'f7': '{{num|printf +.5f}}',
            'f8': '{{num|printf f}}',
            'f9': '{{num|printf .0f}}',
            'x1': '{{num|printf 6x}}',
            'x2': '{{num|printf #06x}}',
            'x3': '{{num|printf  #6x}}',
            'o1': '{{num|printf #o}}',
            's1': '{{str|printf  10s}}',
            'd1': '{{num|printf 05d}}',
            'i1': '{{num|printf 05d}}',
            'u1': '{{num|printf 05u}}',
            'g1': '{{num|printf g}}',
            'e1': '{{num|printf e}}',
            'e2': '{{num|printf E}}',
        });
        expect(t('f1', { num: 5 })).to.equal('   5.00000');
        expect(t('f1', { num: 5.7 })).to.equal('   5.70000');
        expect(t('f1', { num: 100.7 })).to.equal(' 100.70000');
        expect(t('f1', { num: 100.123457 })).to.equal(' 100.12346');
        expect(t('f2', { num: 5 })).to.equal('0005.00000');
        expect(t('f3', { num: 5 })).to.equal('0000000005');
        expect(t('f3', { num: 5.123 })).to.equal('000005.123');
        expect(t('f4', { num: 5 })).to.equal('00000005');
        expect(t('f4', { num: 5.123 })).to.equal('0005.123');
        expect(t('f5', { num: 5.123 })).to.equal('5.12300');
        expect(t('f6', { num: 5.1 })).to.equal('5.1');
        expect(t('f6', { num: 5 })).to.equal('5.');
        expect(t('f7', { num: 5 })).to.equal('+5.00000');
        expect(t('f7', { num: -5 })).to.equal('-5.00000');
        expect(t('f8', { num: 5 })).to.equal('5');
        expect(t('f9', { num: 5.123 })).to.equal('5');
        expect(t('x1', { num: 64 })).to.equal('    40');
        expect(t('x2', { num: 64 })).to.equal('0x0040');
        expect(t('x3', { num: 64 })).to.equal('  0x40');
        expect(t('o1', { num: 64 })).to.equal('0100');
        expect(t('s1', { str: 'abcdefg' })).to.equal('abcdefg');
        expect(t('d1', { num: 12 })).to.equal('00012');
        expect(t('i1', { num: 12 })).to.equal('00012');
        expect(t('u1', { num: 12 })).to.equal('00012');
        expect(t('u1', { num: -12 })).to.equal('4294967284');
        expect(t('g1', { num: 123.3454 })).to.equal('123.3454');
        expect(t('e1', { num: 12345678 })).to.equal('1.2345678e+7');
        expect(t('e1', { num: 12345.678 })).to.equal('1.2345678e+4');
        expect(t('e2', { num: 12345678 })).to.equal('1.2345678E+7');
    });

    it('applies multiple filters', () => {
        i18n.add('en', { 'foo': 'BAR', 'complex': 'foo {foo|lower|json} end' });
        expect(t('complex')).to.equal('foo "bar" end');
    });

    it('applies nested t("...")', () => {
        i18n.add('en', { 'foo': 'bar {{v}}', 'complex': 'foo t("foo", {"v": {{value|json}}}) end' });
        expect(t('complex', { value: 5 })).to.equal('foo bar 5 end');
    });
});
