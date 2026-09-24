from pydantic import BaseModel, ConfigDict, Field, SecretStr


class ProvisionClientRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    name: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=80)
    emails: list[str] = Field(default_factory=list)
    password: SecretStr | None = Field(default=None, repr=False)
    active: bool = True
