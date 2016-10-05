js-i18n
=======

[![npm Version](https://badge.fury.io/js/js-i18n.png)](https://npmjs.org/package/js-i18n)

An i18n library.

I don't have time yet for documentation, but figuring it out from the JSDocs in the code is pretty easy...

## Features

* Supports both browser mode (global i18n) an node.js mode (module.exports)
* Use `i18n.t(key)` or `i18n.t(key, subkey, subkey)` or `i18n.t([key, subkey, subkey])`
* `t` function can be moved around without its namespace (so you can do just `t('key.subkey')`)
* Use `i18n.processLocalizedString(...)` to process a string as a template containing `t`s and `{...}`s.
* Recurse by nesting `{...}` in `t(...)`s
* Date parser (`i18n.parseDate(...)`) & formatter (`i18n.formatDate(...)`)
* C style format specifiers
* Filters for encoding result to JSON, URL, HTML, HTML-with-newlines, lower-case, UPPER-CASE, Upperfirst, etc.
* Filter for specifying printf (C-style) formats.
* Detect browser's short date format (`i18n.detectShortDateFormat()`)
* Format a number for display or parse a number (`i18n.displayNumber(...)`, `i18n.parseNumber(...)`)
* Plurals support (Using `count` option when localizing a string, and retrieving plural _key from `plural()` callback in i18n options)
* Gender support (Using `gender` option when localizing a string, and retrieving the `gender` key from the localized result, falling back to neutral gender)

## Me
* Hi! I am Daniel Cohen Gindi. Or in short- Daniel.
* danielgindi@gmail.com is my email address.
* That's all you need to know.

## Help

If you like what you see here, and want to support the work being done in this repository, you could:
* Actually code, and issue pull requests
* Spread the word
* 
Buy me a beer! 
[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G6CELS3E997ZE)
 Thanks :-)

## License

All the code here is under MIT license. Which means you could do virtually anything with the code.
I will appreciate it very much if you keep an attribution where appropriate.

    The MIT License (MIT)
    
    Copyright (c) 2013 Daniel Cohen Gindi (danielgindi@gmail.com)
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
