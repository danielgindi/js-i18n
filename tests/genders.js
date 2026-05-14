import { expect } from 'chai';
import i18n, { t } from '../src/i18n.ts';

describe('genders', () => {

    beforeEach(() => {
        i18n.reset();
    })

    it('correctly selects genderized word from key (f)', () => {
        i18n.add('es', {
            'foo': '{genders.a|g:noun_gender} {noun|lower}',

            'noun': 'Patata',
            'noun_gender': 'f',
            'genders': {
                'a': {
                    'm': 'Un',
                    'f': 'Una'
                },
            }
        });
        expect(t('foo')).to.equal('Una patata');
    });

    it('correctly selects genderized word from key (female)', () => {
        i18n.add('es', {
            'foo': '{genders.a|g:noun_gender} {noun|lower}',

            'noun': 'Patata',
            'noun_gender': 'female',
            'genders': {
                'a': {
                    'm': 'Un',
                    'f': 'Una'
                },
            }
        });
        expect(t('foo')).to.equal('Una patata');
    });

    it('correctly selects genderized word from key (m)', () => {
        i18n.add('es', {
            'foo': '{genders.a|g:noun_gender} {noun|lower}',

            'noun': 'Tomate',
            'noun_gender': 'm',
            'genders': {
                'a': {
                    'm': 'Un',
                    'f': 'Una'
                },
            }
        });
        expect(t('foo')).to.equal('Un tomate');
    });

    it('correctly selects genderized word from key (male)', () => {
        i18n.add('es', {
            'foo': '{genders.a|g:noun_gender} {noun|lower}',

            'noun': 'Tomate',
            'noun_gender': 'male',
            'genders': {
                'a': {
                    'm': 'Un',
                    'f': 'Una'
                },
            }
        });
        expect(t('foo')).to.equal('Un tomate');
    });

    it('correctly selects default genderized word from key', () => {
        i18n.add('es', {
            'foo': '{genders.a|g:noun_gender} {noun|lower}',

            'noun': 'Patata',
            'noun_gender': 'f',
            'genders': {
                'a': {
                    'm': 'Un',
                    '': 'Una'
                },
            }
        });
        expect(t('foo')).to.equal('Una patata');
    });

    it('correctly selects genderized word from data', () => {
        i18n.add('es', {
            'foo': '{genders.a|g:gender} {noun|lower}',

            'noun': 'Patata',
            'genders': {
                'a': {
                    'm': 'Un',
                    'f': 'Una'
                },
            }
        });
        expect(t('foo', { gender: 'f' })).to.equal('Una patata');
    });

    it('correctly forwards data to genderized word', () => {
        i18n.add('es', {
            'foo': '{genders.a_noun|g:gender}',

            'genders': {
                'a_noun': {
                    'm': 'Un {{noun}}',
                    'f': 'Una {{noun}}'
                },
            }
        });
        expect(t('foo', { gender: 'f', noun: 'patata' })).to.equal('Una patata');
    });

});
