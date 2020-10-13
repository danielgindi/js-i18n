import { expect } from 'chai';
import i18n, { t } from '../src/i18n';

describe('locales', () => {

    beforeEach(() => {
        i18n.reset();
    })

    it('returns the requested value', () => {
        i18n.add('en', { 'foo': 'bar' });
        expect(t('foo')).to.equal('bar');
    });

    it('returns nested value', () => {
        i18n.add('en', { 'foo': { 'bar': 'grandson' }});
        expect(t('foo.bar')).to.equal('grandson');
    });

    it('returns nested value through split keys', () => {
        i18n.add('en', { 'foo': { 'bar': 'grandson' }});
        expect(t('foo', 'bar')).to.equal('grandson');
    });

    it('returns value from fallback language', () => {
        i18n.add('en', { 'foo': 'bar' });
        i18n.add('es', { 'my': 'own' });
        i18n.setFallbackLanguage('en');
        i18n.setActiveLanguage('es');
        expect(t('foo')).to.equal('bar');
        expect(t('my')).to.equal('own');
    });

    it('returns nested value from fallback language', () => {
        i18n.add('en', { 'foo': { 'bar': 'grandson' }, 'bar': { 'foo': 'grandson' }});
        i18n.add('es', { 'bar': {}, 'my': 'own' });
        i18n.setFallbackLanguage('en');
        i18n.setActiveLanguage('es');
        expect(t('foo.bar')).to.equal('grandson');
        expect(t('bar.foo')).to.equal('grandson');
        expect(t('my')).to.equal('own');
    });

    it('returns value from language extension', () => {
        i18n.add('en', { 'foo': { 'bar': 'grandson' }});
        i18n.extendLanguage('en', { 'foo.bar': 'mama' })
        expect(t('foo.bar')).to.equal('mama');
    });

    it('returns value from multi language extension', () => {
        i18n.add('en', { 'foo': { 'bar': 'grandson' }});
        i18n.extendLanguages({ 'en': { 'foo.bar': 'mama' } })
        expect(t('foo.bar')).to.equal('mama');
    });

});
