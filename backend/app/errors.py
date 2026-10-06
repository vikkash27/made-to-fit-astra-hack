class DomainError(Exception):
    def __init__(self, code, message, status=409, details=None, retryable=False):
        self.code, self.message, self.status = code, message, status
        self.details, self.retryable = details, retryable
        super().__init__(message)

    def public(self):
        return dict(
            code=self.code, message=self.message, details=self.details, retryable=self.retryable
        )
