import hydra


# Décorateur de Hydra
@hydra.main(config_path="./conf", config_name="config", version_base=None)
def main(
    cfg,
):  # cfg représente la configuration et est passé automatiquement à la fonction main()

    print(cfg)


if __name__ == "__main__":
    # Il ne faut pas spécifier l'argument "cfg" lors de l'appel à main()
    main()
