function headers(req, res, next) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')
    next()
}

export {headers}