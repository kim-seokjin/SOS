def mask_name(name: str) -> str:
    if len(name) <= 1:
        return name
    if len(name) == 2:
        return name[0] + "*"
    # For 3 or more characters, mask all characters between the first and last
    return name[0] + "*" * (len(name) - 2) + name[-1]
