import os

import hydra


@hydra.main(config_path="./conf", config_name="config", version_base=None)
def main(cfg):
    print(f"Répertoire courant: {os.getcwd()}\n")
    print(f"Répertoire courant original: {hydra.utils.get_original_cwd()}")


if __name__ == "__main__":
    main()
