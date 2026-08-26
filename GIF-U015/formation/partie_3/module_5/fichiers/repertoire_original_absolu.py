import hydra


@hydra.main(config_path="./conf", config_name="config", version_base=None)
def main(cfg):
    # Ajout de bar/foo au répertoire courant original
    print(hydra.utils.to_absolute_path("bar/foo"))


if __name__ == "__main__":
    main()
